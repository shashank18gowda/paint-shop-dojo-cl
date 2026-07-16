import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import {
  QUIZ_DEFAULT_QUESTION_COUNT,
  QUIZ_COOLDOWN_PASS_DAYS,
  QUIZ_COOLDOWN_FAIL_DAYS,
  QUIZ_SESSION_TTL_MINUTES,
} from '../../config/constants';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface QuizEligibility {
  eligible: boolean;
  lastAttemptPassed: boolean | null;
  cooldownUntil: Date | null;
  daysRemaining: number;
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);
  private readonly passThreshold: number;
  private readonly defaultQuestionCount: number;
  private readonly cooldownPassDays: number;
  private readonly cooldownFailDays: number;
  private readonly sessionTtlMinutes: number;

  constructor(
    private prisma: PrismaService,
    private leaderboard: LeaderboardService,
    private config: ConfigService,
  ) {
    this.passThreshold = this.config.get<number>('QUIZ_PASS_THRESHOLD_PERCENT', 50);
    this.defaultQuestionCount = this.config.get<number>('QUIZ_DEFAULT_QUESTION_COUNT', QUIZ_DEFAULT_QUESTION_COUNT);
    this.cooldownPassDays = this.config.get<number>('QUIZ_COOLDOWN_PASS_DAYS', QUIZ_COOLDOWN_PASS_DAYS);
    this.cooldownFailDays = this.config.get<number>('QUIZ_COOLDOWN_FAIL_DAYS', QUIZ_COOLDOWN_FAIL_DAYS);
    this.sessionTtlMinutes = this.config.get<number>('QUIZ_SESSION_TTL_MINUTES', QUIZ_SESSION_TTL_MINUTES);
  }

  async getEligibility(participantId: string): Promise<QuizEligibility> {
    const last = await this.prisma.participantSession.findFirst({
      where: {
        participantId,
        kind: 'QUIZ',
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true, isPassed: true },
    });

    if (!last || !last.completedAt) {
      return { eligible: true, lastAttemptPassed: null, cooldownUntil: null, daysRemaining: 0 };
    }

    const cooldownDays = last.isPassed ? this.cooldownPassDays : this.cooldownFailDays;
    const cooldownUntil = new Date(last.completedAt.getTime() + cooldownDays * DAY_MS);
    const now = Date.now();

    if (now >= cooldownUntil.getTime()) {
      return { eligible: true, lastAttemptPassed: last.isPassed, cooldownUntil: null, daysRemaining: 0 };
    }

    const daysRemaining = Math.ceil((cooldownUntil.getTime() - now) / DAY_MS);
    return { eligible: false, lastAttemptPassed: last.isPassed, cooldownUntil, daysRemaining };
  }

  private normalizeLanguageCode(lang?: string | null): string {
    const code = lang?.trim();
    return code ? code.toUpperCase() : 'EN';
  }

  private async getLanguageByCode(lang?: string | null) {
    const code = this.normalizeLanguageCode(lang);
    const language = await this.prisma.language.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        isActive: true,
      },
    });
    if (!language) throw new NotFoundException(`Language "${code}" not supported`);
    return language;
  }

  async getQuestions(lang: string, count: number) {
    const language = await this.getLanguageByCode(lang);

    // Load every active language so we can return each question/option in all
    // of them — the client can then switch the display language mid-quiz
    // without a refetch. `language` above remains the "primary" language that
    // governs which questions/options are eligible to appear.
    const activeLanguages = await this.prisma.language.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });
    const codeByLangId = new Map(activeLanguages.map((l) => [l.id, l.code]));

    // Collapse a list of translations into a { EN: "…", KN: "…" } map,
    // keyed by language code. Untranslated languages are simply absent; the
    // client falls back to the primary/EN text for those.
    const toByLang = (translations: { languageId: string; text: string }[]) => {
      const byLang: Record<string, string> = {};
      for (const t of translations) {
        const code = codeByLangId.get(t.languageId);
        if (code) byLang[code] = t.text;
      }
      return byLang;
    };

    const questions = await this.prisma.question.findMany({
      where: { isActive: true },
      include: {
        translations: true,
        options: { include: { translations: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Deduplicate by id — guards against accidental duplicate DB records
    const unique = Array.from(new Map(questions.map((q) => [q.id, q])).values());

    // A question is eligible only if it (and at least one option) is translated
    // in the primary language — same inclusion rule as before. Secondary
    // languages are best-effort and fall back on the client.
    const withTranslations = unique.filter((q) => {
      const hasQuestion = q.translations.some((t) => t.languageId === language.id);
      if (!hasQuestion) return false;
      return q.options.some((o) =>
        o.translations.some((t) => t.languageId === language.id),
      );
    });

    // Deduplicate by primary-language text — guards against separate question
    // records that were accidentally created with identical content
    // (different ids, so the id-based dedup above doesn't catch them)
    const seenText = new Set<string>();
    const deduped = withTranslations.filter((q) => {
      const primary = q.translations.find((t) => t.languageId === language.id)!;
      const key = primary.text.trim().toLowerCase();
      if (seenText.has(key)) return false;
      seenText.add(key);
      return true;
    });

    // Fisher-Yates shuffle — uniform distribution, unlike sort(() => Math.random() - 0.5)
    for (let i = deduped.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deduped[i], deduped[j]] = [deduped[j], deduped[i]];
    }

    return {
      languages: activeLanguages.map((l) => ({ code: l.code, name: l.name })),
      questions: deduped.slice(0, count).map((q) => ({
        id: q.id,
        type: q.type,
        points: q.points,
        timeLimit: q.timeLimit,
        difficulty: q.difficulty,
        textByLang: toByLang(q.translations),
        // Only options translated in the primary language appear, so the option
        // set stays identical no matter which language is displayed.
        options: q.options
          .filter((o) => o.translations.some((t) => t.languageId === language.id))
          .sort(() => (q.shuffleOptions ? Math.random() - 0.5 : 0))
          .map((o) => ({
            id: o.id,
            textByLang: toByLang(o.translations),
          })),
      })),
    };
  }

  async startSession(participantId: string, dto: StartSessionDto) {
    const eligibility = await this.getEligibility(participantId);
    if (!eligibility.eligible) {
      throw new ForbiddenException({
        code: 'QUIZ_COOLDOWN',
        message: `You can retake the quiz on ${eligibility.cooldownUntil!.toISOString().slice(0, 10)}`,
        ...eligibility,
      });
    }

    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: { lineId: true },
    });

    const language = await this.getLanguageByCode(dto.language);
    const session = await this.prisma.participantSession.create({
      data: {
        participantId,
        kind: 'QUIZ',
        lineId: participant?.lineId ?? null,
        languageCode: language.code,
        status: 'IN_PROGRESS',
      },
    });
    const { questions, languages } = await this.getQuestions(language.code, dto.questionCount ?? this.defaultQuestionCount);
    return { sessionId: session.id, questions, languages };
  }

  async submitAnswers(sessionId: string, participantId: string, dto: SubmitAnswersDto) {
    const session = await this.prisma.participantSession.findFirst({
      where: { id: sessionId, participantId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Session is already completed');
    }
    return this.finalizeSession(session, participantId, dto, 'COMPLETED');
  }

  /**
   * Best-effort finalization when the participant leaves mid-quiz (the tab/window
   * close beacon). Records whatever partial answers exist and marks the session
   * ABANDONED. No-ops if the session was already finalized (e.g. the beacon
   * races a genuine submit), so it never throws on the way out.
   */
  async abandonSession(sessionId: string, participantId: string, dto: SubmitAnswersDto) {
    const session = await this.prisma.participantSession.findFirst({
      where: { id: sessionId, participantId },
    });
    if (!session || session.status !== 'IN_PROGRESS') return { abandoned: false };
    await this.finalizeSession(session, participantId, dto, 'ABANDONED');
    return { abandoned: true };
  }

  private async finalizeSession(
    session: { id: string; startedAt: Date; participantId: string },
    participantId: string,
    dto: SubmitAnswersDto,
    finalStatus: 'COMPLETED' | 'ABANDONED',
  ) {
    const sessionId = session.id;
    const questionIds = dto.answers.map((a) => a.questionId);
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { options: true },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    interface AnswerRecord {
      questionId: string;
      optionId: string;
      isCorrect: boolean;
      pointsAwarded: number;
      timeTaken: number | undefined;
    }

    const answerRecords: AnswerRecord[] = [];
    for (const a of dto.answers) {
      const question = questionMap.get(a.questionId);
      if (!question) continue;
      const option = question.options.find((o) => o.id === a.optionId);
      const isCorrect = option?.isCorrect ?? false;
      const points = question.points;
      maxScore += points;
      if (isCorrect) {
        score += points;
        correctCount++;
      }
      answerRecords.push({
        questionId: a.questionId,
        optionId: a.optionId,
        isCorrect,
        pointsAwarded: isCorrect ? points : 0,
        timeTaken: a.timeTaken,
      });
    }

    // If the session had more questions than submitted (timer ran out / tab closed),
    // count unanswered ones as 0-scored but still part of the denominator.
    const unanswered = Math.max(0, (dto.totalQuestions ?? dto.answers.length) - dto.answers.length);
    const effectiveMaxScore = maxScore + unanswered; // unanswered questions default to 1 pt each
    const percentage = effectiveMaxScore > 0 ? (score / effectiveMaxScore) * 100 : 0;

    const performanceLevel = await this.prisma.performanceLevel.findFirst({
      where: {
        isActive: true,
        minScore: { lte: percentage },
        maxScore: { gte: percentage },
      },
    });

    const completedAt = new Date();
    const durationSeconds = Math.floor(
      (completedAt.getTime() - session.startedAt.getTime()) / 1000,
    );
    // Abandoned sessions never count as passed, regardless of the partial score.
    const isPassed = finalStatus === 'COMPLETED' && percentage >= this.passThreshold;

    const attempt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.quizAttempt.create({
        data: {
          sessionId,
          totalQuestions: dto.totalQuestions ?? dto.answers.length,
          correctAnswers: correctCount,
          score,
          maxScore: effectiveMaxScore,
          percentage,
          isPassed,
          performanceLevelId: performanceLevel?.id,
          completedAt,
          answers: {
            create: answerRecords.map((r) => ({
              questionId: r.questionId,
              optionId: r.optionId,
              isCorrect: r.isCorrect,
              pointsAwarded: r.pointsAwarded,
              timeTaken: r.timeTaken,
            })),
          },
        },
        include: { performanceLevel: true },
      });

      await tx.participantSession.update({
        where: { id: sessionId },
        data: {
          status: finalStatus,
          completedAt,
          durationSeconds,
          score,
          maxScore: effectiveMaxScore,
          isPassed,
        },
      });

      return created;
    });

    this.logger.log(`Session ${sessionId} ${finalStatus.toLowerCase()} — score: ${score}/${effectiveMaxScore} (${Math.round(percentage)}%)`);

    // Only genuine completions belong on the leaderboard.
    if (finalStatus === 'COMPLETED') {
      await this.leaderboard.upsertEntry(attempt.id, participantId, session.participantId);
    }

    return {
      attemptId: attempt.id,
      score,
      maxScore: effectiveMaxScore,
      percentage: Math.round(percentage * 100) / 100,
      correctAnswers: correctCount,
      totalQuestions: dto.answers.length,
      performance: performanceLevel
        ? { name: performanceLevel.name, color: performanceLevel.color, code: performanceLevel.code }
        : null,
      durationSeconds,
      isPassed,
    };
  }

  /**
   * Reliable backstop for abandonment. The exit beacon is best-effort (it never
   * fires on a crash, power loss, or hard kiosk reset), so any session still
   * IN_PROGRESS well past the point a live tab would have auto-submitted is a
   * dead client. Sweep those to ABANDONED so they don't linger or block retakes.
   */
  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'sweep-abandoned-quiz-sessions' })
  async sweepAbandonedSessions() {
    const cutoff = new Date(Date.now() - this.sessionTtlMinutes * 60_000);
    const stale = await this.prisma.participantSession.findMany({
      where: { kind: 'QUIZ', status: 'IN_PROGRESS', startedAt: { lt: cutoff } },
      select: { id: true },
    });
    if (stale.length === 0) return;

    await this.prisma.participantSession.updateMany({
      where: { id: { in: stale.map((s) => s.id) } },
      data: { status: 'ABANDONED', isPassed: false, completedAt: new Date() },
    });
    this.logger.log(`Swept ${stale.length} stale quiz session(s) → ABANDONED`);
  }

  async getMyHistory(participantId: string, sort: string, limit: number) {
    const sessions = await this.prisma.participantSession.findMany({
      where: { participantId, kind: 'QUIZ', status: 'COMPLETED' },
      include: {
        attempts: {
          include: { performanceLevel: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy:
        sort === 'best'
          ? [{ score: 'desc' }, { completedAt: 'desc' }]
          : { completedAt: 'desc' },
      take: limit,
    });

    return sessions.map((s) => {
      const attempt = s.attempts[0];
      return {
        sessionId: s.id,
        attemptId: attempt?.id ?? null,
        completedAt: s.completedAt,
        score: s.score ?? 0,
        maxScore: s.maxScore ?? 0,
        percentage: attempt?.percentage ?? 0,
        correctAnswers: attempt?.correctAnswers ?? 0,
        totalQuestions: attempt?.totalQuestions ?? 0,
        durationSeconds: s.durationSeconds,
        isPassed: s.isPassed ?? attempt?.isPassed ?? false,
        performance: attempt?.performanceLevel
          ? { name: attempt.performanceLevel.name, color: attempt.performanceLevel.color ?? '#6b6b6b', code: attempt.performanceLevel.code }
          : null,
      };
    });
  }

  async getAttemptReview(attemptId: string, participantId: string, lang: string) {
    const language = await this.getLanguageByCode(lang);

    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        session: true,
        performanceLevel: true,
        answers: {
          include: {
            question: {
              include: {
                translations: true,
                options: {
                  where: { isCorrect: true },
                  include: { translations: true },
                },
              },
            },
            option: { include: { translations: true } },
          },
        },
      },
    });

    if (!attempt || attempt.session.participantId !== participantId) {
      throw new NotFoundException('Attempt not found');
    }

    function pickText(translations: { languageId: string; text: string }[]): string {
      return (
        (language && translations.find((t) => t.languageId === language.id)?.text) ??
        translations[0]?.text ??
        '[No translation]'
      );
    }

    return {
      attemptId: attempt.id,
      completedAt: attempt.completedAt,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      durationSeconds: attempt.session.durationSeconds,
      isPassed: attempt.isPassed,
      performance: attempt.performanceLevel
        ? { name: attempt.performanceLevel.name, color: attempt.performanceLevel.color ?? '#6b6b6b', code: attempt.performanceLevel.code }
        : null,
      questions: attempt.answers.map((a, idx) => ({
        number: idx + 1,
        questionId: a.questionId,
        questionText: pickText(a.question.translations),
        isCorrect: a.isCorrect,
        timeTaken: a.timeTaken ?? null,
        yourAnswer: pickText(a.option.translations),
        correctAnswer: pickText(a.question.options[0]?.translations ?? []),
        explanation: a.question.explanation ?? null,
      })),
    };
  }

  async getSessionResult(sessionId: string, participantId: string) {
    const session = await this.prisma.participantSession.findFirst({
      where: { id: sessionId, participantId },
      include: {
        participant: { include: { designation: true, line: true } },
        attempts: {
          include: {
            performanceLevel: true,
            leaderboardEntry: true,
            certificate: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }
}
