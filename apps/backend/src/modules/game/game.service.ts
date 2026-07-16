import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, QuestionKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import {
  GAME_COOLDOWN_PASS_DAYS,
  GAME_COOLDOWN_FAIL_DAYS,
} from '../../config/constants';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface GameEligibility {
  eligible: boolean;
  lastAttemptPassed: boolean | null;
  cooldownUntil: Date | null;
  daysRemaining: number;
}

// Fisher–Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A question's slot in a model's ordered sequence.
type SeqQuestion = {
  questionId: string;
  stepNo: number;
  kind: QuestionKind;
  correctProcessId: string | null;
};

@Injectable()
export class GameService {
  private readonly cooldownPassDays: number;
  private readonly cooldownFailDays: number;

  constructor(
    private prisma: PrismaService,
    private leaderboard: LeaderboardService,
    private config: ConfigService,
  ) {
    this.cooldownPassDays = this.config.get<number>('GAME_COOLDOWN_PASS_DAYS', GAME_COOLDOWN_PASS_DAYS);
    this.cooldownFailDays = this.config.get<number>('GAME_COOLDOWN_FAIL_DAYS', GAME_COOLDOWN_FAIL_DAYS);
  }

  // ── Eligibility ──────────────────────────────────────────────────────────

  async getEligibility(participantId: string): Promise<GameEligibility> {
    const last = await this.prisma.participantSession.findFirst({
      where: {
        participantId,
        kind: 'GAME',
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

  // ── Master data ──────────────────────────────────────────────────────────

  async getFlow(code: string) {
    const flow = await this.prisma.gameFlow.findUnique({
      where: { code },
      include: {
        questions: {
          orderBy: { stepNo: 'asc' },
          include: { correctProcess: { select: { id: true, code: true, name: true } } },
        },
        bands: true,
      },
    });
    if (!flow) throw new NotFoundException('Game flow not found');
    return flow;
  }

  // ── i18n ───────────────────────────────────────────────────────────────────

  /** Resolves a language code to its id, or null to fall back to base text. */
  private async resolveLanguageId(code?: string | null): Promise<string | null> {
    if (!code) return null;
    const language = await this.prisma.language.findFirst({
      where: { code: { equals: code, mode: 'insensitive' }, isActive: true },
      select: { id: true },
    });
    return language?.id ?? null;
  }

  /** Overlays a question's translated prompt on the base, per-field fallback. */
  private localizeQuestion(question: {
    questionText: string;
    initialVisualText: string | null;
    carVisualBefore: string | null;
    translations: {
      questionText: string;
      initialVisualText: string | null;
      carVisualBefore: string | null;
    }[];
  }) {
    const t = question.translations[0];
    return {
      questionText: t?.questionText ?? question.questionText,
      initialVisualText: t?.initialVisualText ?? question.initialVisualText,
      carVisualBefore: t?.carVisualBefore ?? question.carVisualBefore,
    };
  }

  /** Overlays a process's translated reveal fields on the base, per-field fallback. */
  private localizeProcess(process: {
    name: string;
    carVisualAfter: string | null;
    animationFeedback: string | null;
    translations: {
      name: string;
      carVisualAfter: string | null;
      animationFeedback: string | null;
    }[];
  }) {
    const t = process.translations[0];
    return {
      name: t?.name ?? process.name,
      carVisualAfter: t?.carVisualAfter ?? process.carVisualAfter,
      animationFeedback: t?.animationFeedback ?? process.animationFeedback,
    };
  }

  /** All active languages — the base of the "every language, up front" batch payload. */
  private async getActiveLanguages() {
    return this.prisma.language.findMany({
      where: { isActive: true },
      select: { id: true, code: true },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Builds a `{ [languageCode]: value }` map for one localizable value, given the
   * base (English) value and a list of `{ languageId, value }` translation rows.
   * English has no translation row (it IS the base), so it always falls back.
   */
  private byLanguageCode<V>(
    base: V,
    rows: { languageId: string; value: V }[],
    languages: { id: string; code: string }[],
  ): Record<string, V> {
    const out: Record<string, V> = {};
    for (const lang of languages) {
      out[lang.code.toLowerCase()] =
        rows.find((r) => r.languageId === lang.id)?.value ?? base;
    }
    return out;
  }

  /** Like localizeQuestion, but returns every active language's prompt at once. */
  private localizeQuestionAllLanguages(
    question: {
      questionText: string;
      initialVisualText: string | null;
      carVisualBefore: string | null;
      translations: {
        languageId: string;
        questionText: string;
        initialVisualText: string | null;
        carVisualBefore: string | null;
      }[];
    },
    languages: { id: string; code: string }[],
  ) {
    const out: Record<
      string,
      {
        questionText: string;
        initialVisualText: string | null;
        carVisualBefore: string | null;
      }
    > = {};
    for (const lang of languages) {
      const t = question.translations.find((tr) => tr.languageId === lang.id);
      out[lang.code.toLowerCase()] = {
        questionText: t?.questionText ?? question.questionText,
        initialVisualText: t?.initialVisualText ?? question.initialVisualText,
        carVisualBefore: t?.carVisualBefore ?? question.carVisualBefore,
      };
    }
    return out;
  }

  // ── Car models ─────────────────────────────────────────────────────────────

  /** Active car models for a flow — drives the "choose a car model" screen. */
  async getModels(flowCode: string) {
    const flow = await this.prisma.gameFlow.findUnique({
      where: { code: flowCode },
      select: { id: true },
    });
    if (!flow) throw new NotFoundException('Game flow not found');
    return this.prisma.carModel.findMany({
      where: { flowId: flow.id, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true, imageUrl: true },
    });
  }

  /** Active colours a model is available in — drives the colour-choice screen. */
  async getModelColours(modelCode: string) {
    const model = await this.prisma.carModel.findUnique({
      where: { code: modelCode },
      select: { id: true },
    });
    if (!model) throw new NotFoundException('Car model not found');
    return this.getModelColourRows(model.id);
  }

  /** Same data as getModelColours, but by model id — used to populate the
   *  COLOUR_PICK screen's options inline in the run/batch payloads. */
  private async getModelColourRows(carModelId: string) {
    const links = await this.prisma.carModelColour.findMany({
      where: { carModelId, carColour: { isActive: true } },
      orderBy: [{ sortOrder: 'asc' }, { carColour: { name: 'asc' } }],
      select: {
        carColour: {
          select: { id: true, code: true, name: true, hex: true, imageUrl: true },
        },
      },
    });
    return links.map((l) => l.carColour);
  }

  /**
   * The ordered questions a model plays. Each question carries its OWN correct
   * answer (correctProcessId) — there is no positional "next" derivation, so the
   * correct option always matches the state shown on that screen. A question with
   * a null correctProcessId (COLOUR_PICK / CONFIRM) is shown but not scored.
   */
  private async getModelQuestions(carModelId: string): Promise<SeqQuestion[]> {
    const rows = await this.prisma.carModelQuestion.findMany({
      where: { carModelId },
      orderBy: { stepNo: 'asc' },
      select: {
        stepNo: true,
        question: { select: { id: true, kind: true, correctProcessId: true } },
      },
    });
    return rows.map((r) => ({
      questionId: r.question.id,
      stepNo: r.stepNo,
      kind: r.question.kind,
      correctProcessId: r.question.correctProcessId,
    }));
  }

  /** Number of scored (answerable) questions in a sequence × points = the ceiling. */
  private maxScoreFor(sequence: SeqQuestion[], pointsPerCorrect: number) {
    return sequence.filter((q) => q.correctProcessId).length * pointsPerCorrect;
  }

  // ── Play ─────────────────────────────────────────────────────────────────

  async startRun(
    participantId: string,
    carModelCode: string,
    languageCode?: string,
    carColourCode?: string,
  ) {
    const eligibility = await this.getEligibility(participantId);
    if (!eligibility.eligible) {
      throw new ForbiddenException({
        code: 'GAME_COOLDOWN',
        message: `You can replay the game on ${eligibility.cooldownUntil!.toISOString().slice(0, 10)}`,
        ...eligibility,
      });
    }

    const model = await this.prisma.carModel.findUnique({
      where: { code: carModelCode },
      include: { flow: true },
    });
    if (!model || !model.isActive) {
      throw new NotFoundException('Car model not found');
    }

    // Optional colour must be one the chosen model is available in.
    let colour: { id: string; code: string; name: string; hex: string | null } | null =
      null;
    if (carColourCode) {
      const link = await this.prisma.carModelColour.findFirst({
        where: {
          carModelId: model.id,
          carColour: { code: carColourCode, isActive: true },
        },
        select: {
          carColour: { select: { id: true, code: true, name: true, hex: true } },
        },
      });
      if (!link) {
        throw new BadRequestException('Colour not available for this model');
      }
      colour = link.carColour;
    }

    const sequence = await this.getModelQuestions(model.id);
    if (sequence.length === 0) {
      throw new BadRequestException('Car model has no playable questions');
    }

    const maxScore = this.maxScoreFor(sequence, model.flow.pointsPerCorrect);

    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: { lineId: true },
    });

    // A game play is also a kiosk "visit" — track it as a GAME session so it
    // shares the same session surface as the quiz (without polluting quiz-only
    // reports/cooldown, which filter on kind = QUIZ).
    const session = await this.prisma.participantSession.create({
      data: {
        participantId,
        kind: 'GAME',
        lineId: participant?.lineId ?? null,
        languageCode,
        status: 'IN_PROGRESS',
      },
    });

    const run = await this.prisma.gameRun.create({
      data: {
        sessionId: session.id,
        flowId: model.flowId,
        carModelId: model.id,
        carColourId: colour?.id ?? null,
        maxScore,
      },
    });

    // Serve the first question, localized to the run's language.
    const languageId = await this.resolveLanguageId(languageCode);
    const firstStep = await this.buildStep({
      runId: run.id,
      flowId: model.flowId,
      carModelId: model.id,
      question: sequence[0],
      languageId,
    });
    return {
      runId: run.id,
      maxScore,
      carModel: { code: model.code, name: model.name },
      carColour: colour
        ? { code: colour.code, name: colour.name, hex: colour.hex }
        : null,
      ...firstStep,
    };
  }

  /**
   * Builds the on-screen options for a question: the correct process plus 3
   * random distractors drawn from other processes in the same flow. The exact
   * set shown is persisted on the GameRunStep so it can be reconstructed later.
   * A COLOUR_PICK question is served with the model's colours as options instead
   * (same data as GET /models/:code/colours). CONFIRM questions get no options.
   */
  private async buildStep(opts: {
    runId: string;
    flowId: string;
    carModelId: string;
    question: SeqQuestion;
    languageId: string | null;
  }) {
    const { runId, flowId, carModelId, question, languageId } = opts;
    const { questionId, stepNo, kind, correctProcessId } = question;

    const gameQuestion = await this.prisma.gameQuestion.findUnique({
      where: { id: questionId },
      include: { translations: { where: { languageId: languageId ?? '' } } },
    });
    if (!gameQuestion) throw new NotFoundException('Question not found');

    let options: { id: string; name: string; hex?: string | null; imageUrl?: string | null }[] =
      [];
    let shownProcessIds: string[] = [];

    if (correctProcessId) {
      const optionSelect = {
        id: true,
        name: true,
        translations: {
          where: { languageId: languageId ?? '' },
          select: { name: true },
        },
      } as const;

      const distractors = await this.prisma.gameProcess.findMany({
        where: { flowId, eligibleAsDistractor: true, id: { not: correctProcessId } },
        select: optionSelect,
      });
      const correct = await this.prisma.gameProcess.findUniqueOrThrow({
        where: { id: correctProcessId },
        select: optionSelect,
      });

      const wrong = shuffle(distractors).slice(0, 3);
      const shuffled = shuffle([correct, ...wrong]);
      options = shuffled.map((o) => ({
        id: o.id,
        name: o.translations[0]?.name ?? o.name,
      }));
      shownProcessIds = shuffled.map((o) => o.id);
    } else if (kind === QuestionKind.COLOUR_PICK) {
      const colours = await this.getModelColourRows(carModelId);
      options = colours.map((c) => ({
        id: c.id,
        name: c.name,
        hex: c.hex,
        imageUrl: c.imageUrl,
      }));
    }

    await this.prisma.gameRunStep.upsert({
      where: { runId_questionId: { runId, questionId } },
      update: {},
      create: { runId, questionId, shownProcessIds },
    });

    const loc = this.localizeQuestion(gameQuestion);
    return {
      questionId,
      stepNo,
      kind,
      questionText: loc.questionText,
      initialVisualText: loc.initialVisualText,
      carVisualBefore: loc.carVisualBefore,
      options,
    };
  }

  /**
   * Like buildStep, but for batch play: fetches every active language's text
   * (not just the session's) for the question, its options, and its hints, so
   * the client can switch language mid-session without another round trip.
   */
  private async buildBatchStep(opts: {
    runId: string;
    flowId: string;
    carModelId: string;
    question: SeqQuestion;
    languages: { id: string; code: string }[];
  }) {
    const { runId, flowId, carModelId, question, languages } = opts;
    const { questionId, stepNo, kind, correctProcessId } = question;

    const gameQuestion = await this.prisma.gameQuestion.findUnique({
      where: { id: questionId },
      include: { translations: true },
    });
    if (!gameQuestion) throw new NotFoundException('Question not found');

    type OptionShape = {
      id: string;
      name: string;
      hex?: string | null;
      imageUrl?: string | null;
      translations: { languageId: string; name: string }[];
    };
    let optionRows: OptionShape[] = [];
    let shownProcessIds: string[] = [];
    let carVisualAfter: string | null = null;
    let animationFeedback: string | null = null;
    let hints: { order: number; translations: Record<string, string> }[] = [];

    if (correctProcessId) {
      const distractors = await this.prisma.gameProcess.findMany({
        where: { flowId, eligibleAsDistractor: true, id: { not: correctProcessId } },
        select: {
          id: true,
          name: true,
          translations: { select: { languageId: true, name: true } },
        },               
      });
      const correct = await this.prisma.gameProcess.findUniqueOrThrow({
        where: { id: correctProcessId },
        include: {
          translations: true,
          hints: { orderBy: { order: 'asc' }, include: { translations: true } },
        },
      });

      const wrong = shuffle(distractors).slice(0, 3);
      optionRows = shuffle([
        {
          id: correct.id,
          name: correct.name,
          translations: correct.translations.map((t) => ({
            languageId: t.languageId,
            name: t.name,
          })),
        },
        ...wrong,
      ]);
      shownProcessIds = optionRows.map((o) => o.id);

      // The reveal (post-answer visuals) is intrinsic to the correct process.
      carVisualAfter = correct.carVisualAfter;
      animationFeedback = correct.animationFeedback;
      hints = correct.hints.map((h) => ({
        order: h.order,
        translations: this.byLanguageCode(
          h.text,
          h.translations.map((t) => ({ languageId: t.languageId, value: t.text })),
          languages,
        ),
      }));
    } else if (kind === QuestionKind.COLOUR_PICK) {
      const colours = await this.getModelColourRows(carModelId);
      optionRows = colours.map((c) => ({
        id: c.id,
        name: c.name,
        hex: c.hex,
        imageUrl: c.imageUrl,
        translations: [], // colours have no per-language name, base name is the fallback
      }));
    }

    await this.prisma.gameRunStep.upsert({
      where: { runId_questionId: { runId, questionId } },
      update: {},
      create: { runId, questionId, shownProcessIds },
    });

    return {
      questionId,
      stepNo,
      kind,
      // Base (English) visual/asset state — language-independent, for asset
      // selection. carVisualBefore is the question's prompt state; carVisualAfter
      // / animationFeedback are the correct process's reveal.
      carVisualBefore: gameQuestion.carVisualBefore,
      carVisualAfter,
      animationFeedback,
      // Batch play is graded client-side from locally-served data (no per-click
      // round trip), so the correct answer is exposed directly here. Null for
      // non-scored (COLOUR_PICK / CONFIRM) screens.
      correctProcessId,
      translations: this.localizeQuestionAllLanguages(gameQuestion, languages),
      // Every option's name, per language. hex/imageUrl are only present for
      // COLOUR_PICK options (the model's colours).
      options: optionRows.map((o) => ({
        id: o.id,
        ...(o.hex !== undefined ? { hex: o.hex } : {}),
        ...(o.imageUrl !== undefined ? { imageUrl: o.imageUrl } : {}),
        translations: this.byLanguageCode(
          o.name,
          o.translations.map((t) => ({ languageId: t.languageId, value: t.name })),
          languages,
        ),
      })),
      // Every hint, in order, with per-language text — served up front since
      // batch play is graded client-side, with no per-click round trip to reveal them.
      hints,
    };
  }

  /** Builds the next step, or finishes the run when the last question is done. */
  private async advanceOrFinish(
    runId: string,
    flowId: string,
    carModelId: string,
    sequence: SeqQuestion[],
    pos: number,
    languageId: string | null,
  ): Promise<Record<string, unknown>> {
    const nextPos = pos + 1;
    if (nextPos < sequence.length) {
      return {
        nextStep: await this.buildStep({
          runId,
          flowId,
          carModelId,
          question: sequence[nextPos],
          languageId,
        }),
      };
    }
    return { finished: await this.completeRun(runId) };
  }

  /**
   * Records a single answer click. On wrong → returns the next progressive hint.
   * On correct → applies score and returns the post-answer visuals + next step.
   * Non-scored screens (COLOUR_PICK / CONFIRM) auto-advance with 0 points.
   */
  async submitAnswer(
    runId: string,
    participantId: string,
    questionId: string,
    chosenProcessId: string,
  ) {
    const run = await this.prisma.gameRun.findFirst({
      where: { id: runId, session: { participantId } },
      include: { flow: true, session: { select: { languageCode: true } } },
    });
    if (!run) throw new NotFoundException('Game run not found');
    if (run.status !== 'IN_PROGRESS')
      throw new BadRequestException('Run already finished');
    if (!run.carModelId)
      throw new BadRequestException('Run has no car model');

    const sequence = await this.getModelQuestions(run.carModelId);
    const pos = sequence.findIndex((q) => q.questionId === questionId);
    if (pos === -1) {
      throw new BadRequestException('Not a question in this run');
    }
    const question = sequence[pos];
    const languageId = await this.resolveLanguageId(run.session.languageCode);

    const step = await this.prisma.gameRunStep.findUnique({
      where: { runId_questionId: { runId, questionId } },
    });
    if (!step)
      throw new BadRequestException('Step was not served for this run');
    if (step.isCorrect)
      throw new BadRequestException('Step already answered');

    // Non-scored screen: acknowledge and advance, no grading. chosenProcessId
    // isn't a GameProcess id here (COLOUR_PICK options are CarColour ids, CONFIRM
    // has no options at all), so it isn't logged as a GameAnswerEvent — that
    // table's chosenProcessId is FK'd to GameProcess.
    if (!question.correctProcessId) {
      await this.prisma.gameRunStep.update({
        where: { id: step.id },
        data: { isCorrect: true, pointsAwarded: 0 },
      });
      return {
        correct: true,
        pointsAwarded: 0,
        ...(await this.advanceOrFinish(
        runId,
        run.flowId,
        run.carModelId,
        sequence,
        pos,
        languageId,
      )),
      };
    }

    const correctProcessId = question.correctProcessId;
    const process = await this.prisma.gameProcess.findUnique({
      where: { id: correctProcessId },
      include: {
        translations: { where: { languageId: languageId ?? '' } },
        hints: {
          orderBy: { order: 'asc' },
          include: {
            translations: { where: { languageId: languageId ?? '' } },
          },
        },
      },
    });
    if (!process) throw new NotFoundException('Process not found');

    const loc = this.localizeProcess(process);
    const isCorrect = chosenProcessId === correctProcessId;
    const attemptNo = step.wrongAttempts + 1;

    if (!isCorrect) {
      const wrongAttempts = step.wrongAttempts + 1;
      const hint = process.hints.find((h) => h.order === wrongAttempts) ?? null;

      await this.prisma.$transaction([
        this.prisma.gameAnswerEvent.create({
          data: {
            stepId: step.id,
            chosenProcessId,
            attemptNo,
            isCorrect: false,
            hintRevealed: hint?.order ?? null,
          },
        }),
        this.prisma.gameRunStep.update({
          where: { id: step.id },
          data: { wrongAttempts },
        }),
      ]);

      return {
        correct: false,
        wrongAttempts,
        hint: hint ? (hint.translations[0]?.text ?? hint.text) : null,
        hintsRemaining: Math.max(0, run.flow.maxWrongAttempts - wrongAttempts),
        animationFeedback: loc.animationFeedback,
      };
    }

    // Correct: full points first try, otherwise points minus wrong penalties.
    const earned =
      run.flow.pointsPerCorrect - step.wrongAttempts * run.flow.penaltyPerWrong;
    const pointsAwarded = Math.max(0, earned);

    await this.prisma.$transaction([
      this.prisma.gameAnswerEvent.create({
        data: { stepId: step.id, chosenProcessId, attemptNo, isCorrect: true },
      }),
      this.prisma.gameRunStep.update({
        where: { id: step.id },
        data: { isCorrect: true, pointsAwarded },
      }),
      this.prisma.gameRun.update({
        where: { id: runId },
        data: { score: { increment: pointsAwarded } },
      }),
    ]);

    return {
      correct: true,
      pointsAwarded,
      carVisualAfter: loc.carVisualAfter,
      animationFeedback: loc.animationFeedback,
      ...(await this.advanceOrFinish(
        runId,
        run.flowId,
        run.carModelId,
        sequence,
        pos,
        languageId,
      )),
    };
  }

  // ── Batch play (quiz-style: serve all questions, submit all at the end) ────

  /**
   * Starts a run and serves EVERY question up front (unlike startRun, which
   * serves one at a time). Mirrors the quiz's "fetch all questions" step so the
   * client can play the whole flow locally and submit once at the end. Each
   * step's shown options are persisted (via buildBatchStep) so submitBatch can
   * grade against the exact screen the trainee saw. Leaves the per-answer flow
   * intact. No colour is collected here — colour is chosen client-side, mid-flow.
   * Every active language's text is included per question/option/hint so the
   * client can switch language mid-session without calling the API again.
   */
  async startBatchRun(
    participantId: string,
    carModelCode: string,
    languageCode?: string,
  ) {
    const eligibility = await this.getEligibility(participantId);
    if (!eligibility.eligible) {
      throw new ForbiddenException({
        code: 'GAME_COOLDOWN',
        message: `You can replay the game on ${eligibility.cooldownUntil!.toISOString().slice(0, 10)}`,
        ...eligibility,
      });
    }

    const model = await this.prisma.carModel.findUnique({
      where: { code: carModelCode },
      include: { flow: true },
    });
    if (!model || !model.isActive) {
      throw new NotFoundException('Car model not found');
    }

    const sequence = await this.getModelQuestions(model.id);
    if (sequence.length === 0) {
      throw new BadRequestException('Car model has no playable questions');
    }

    const maxScore = this.maxScoreFor(sequence, model.flow.pointsPerCorrect);

    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: { lineId: true },
    });

    const session = await this.prisma.participantSession.create({
      data: {
        participantId,
        kind: 'GAME',
        lineId: participant?.lineId ?? null,
        languageCode,
        status: 'IN_PROGRESS',
      },
    });

    const run = await this.prisma.gameRun.create({
      data: {
        sessionId: session.id,
        flowId: model.flowId,
        carModelId: model.id,
        maxScore,
      },
    });

    // Serve all questions (every position — nothing is terminal), all languages.
    const languages = await this.getActiveLanguages();
    const questions: Awaited<ReturnType<typeof this.buildBatchStep>>[] = [];
    for (const question of sequence) {
      questions.push(
        await this.buildBatchStep({
          runId: run.id,
          flowId: model.flowId,
          carModelId: model.id,
          question,
          languages,
        }),
      );
    }

    return {
      runId: run.id,
      maxScore,
      pointsPerCorrect: model.flow.pointsPerCorrect,
      penaltyPerWrong: model.flow.penaltyPerWrong,
      penaltyPerHint: model.flow.penaltyPerHint,
      maxWrongAttempts: model.flow.maxWrongAttempts,
      carModel: { code: model.code, name: model.name },
      languageCode: languageCode ?? 'EN',
      availableLanguages: languages.map((l) => l.code),
      questions,
    };
  }

  /**
   * Grades a whole run in one shot from the clicks collected on the client,
   * then finalizes it. The quiz-style counterpart to submitAnswer: no per-click
   * hint round trip, but every click the trainee made is still reported (in
   * order) and logged as its own GameAnswerEvent, same as the per-click flow.
   * The client may also report isCorrect/wrongAttempts/pointsAwarded/score for
   * convenience, but they're accepted-and-ignored: this method always
   * independently recomputes them from each question's stored correct answer, so
   * a client can't shortcut its own score.
   */
  async submitBatch(
    runId: string,
    participantId: string,
    steps: {
      questionId: string;
      answers: { chosenProcessId: string; attemptNo: number }[];
      timeTaken?: number;
      hintUsed?: number;
    }[],
    carColourId?: string,
  ) {
    const run = await this.prisma.gameRun.findFirst({
      where: { id: runId, session: { participantId } },
      include: { flow: true },
    });
    if (!run) throw new NotFoundException('Game run not found');
    if (run.status !== 'IN_PROGRESS')
      throw new BadRequestException('Run already finished');
    if (!run.carModelId)
      throw new BadRequestException('Run has no car model');

    // Colour is chosen mid-flow client-side (e.g. at the Base Coat step) and
    // reported once here, since start-batch no longer collects it up front.
    if (carColourId) {
      const link = await this.prisma.carModelColour.findFirst({
        where: {
          carModelId: run.carModelId,
          carColourId,
          carColour: { isActive: true },
        },
        select: { id: true },
      });
      if (!link) {
        throw new BadRequestException('Colour not available for this model');
      }
    }

    // Each question's stored correct answer (null = non-scored screen).
    const sequence = await this.getModelQuestions(run.carModelId);
    const correctByQuestion = new Map<string, string | null>(
      sequence.map((q) => [q.questionId, q.correctProcessId]),
    );

    // The steps served at start-batch — grade only against these.
    const runSteps = await this.prisma.gameRunStep.findMany({ where: { runId } });
    const stepByQuestion = new Map(runSteps.map((s) => [s.questionId, s]));

    const ops: Prisma.PrismaPromise<unknown>[] = [];
    let totalAwarded = 0;

    for (const s of steps) {
      if (!correctByQuestion.has(s.questionId)) continue; // not part of this run
      const step = stepByQuestion.get(s.questionId);
      if (!step || step.isCorrect) continue;

      const correctProcessId = correctByQuestion.get(s.questionId) ?? null;
      const clicks = [...s.answers].sort((a, b) => a.attemptNo - b.attemptNo);

      // Non-scored screen (COLOUR_PICK / CONFIRM): mark done, award nothing.
      // Clicks aren't logged as GameAnswerEvent rows here — chosenProcessId on
      // that table is FK'd to GameProcess, but COLOUR_PICK options are CarColour
      // ids and CONFIRM has no options at all, so there's nothing valid to log.
      if (!correctProcessId) {
        ops.push(
          this.prisma.gameRunStep.update({
            where: { id: step.id },
            data: { isCorrect: true, pointsAwarded: 0, timeTaken: s.timeTaken },
          }),
        );
        continue;
      }

      // Unanswered/skipped question: no clicks to grade, so mark it wrong
      // with 0 points rather than leaving the step at its created defaults
      // (which would silently hide that time/hints were reported for it).
      if (clicks.length === 0) {
        ops.push(
          this.prisma.gameRunStep.update({
            where: { id: step.id },
            data: {
              isCorrect: false,
              wrongAttempts: 0,
              hintsUsed: Math.max(0, s.hintUsed ?? 0),
              pointsAwarded: 0,
              timeTaken: s.timeTaken,
            },
          }),
        );
        continue;
      }

      // The trainee is "correct" only if the LAST click landed on the right
      // answer; every click before that (right or not) counts as a wrong attempt.
      const finalChoice = clicks[clicks.length - 1].chosenProcessId;
      const isCorrect = finalChoice === correctProcessId;
      const wrongAttempts = isCorrect ? clicks.length - 1 : clicks.length;
      const hintsUsed = Math.max(0, s.hintUsed ?? 0);
      const pointsAwarded = isCorrect
        ? Math.max(
            0,
            run.flow.pointsPerCorrect -
              wrongAttempts * run.flow.penaltyPerWrong -
              hintsUsed * run.flow.penaltyPerHint,
          )
        : 0;
      totalAwarded += pointsAwarded;

      // One GameAnswerEvent per click, in order — mirrors the per-click flow.
      // isCorrect per click is recomputed here too, never trusted from the client.
      // A wrong click's hintRevealed is its attemptNo — same "wrongAttempts ==
      // hint order" convention the per-click flow uses (schema.prisma, GameRunStep
      // .wrongAttempts). The final correct click (if any) reveals no new hint.
      for (const click of clicks) {
        const clickIsCorrect = click.chosenProcessId === correctProcessId;
        ops.push(
          this.prisma.gameAnswerEvent.create({
            data: {
              stepId: step.id,
              chosenProcessId: click.chosenProcessId,
              attemptNo: click.attemptNo,
              isCorrect: clickIsCorrect,
              hintRevealed: clickIsCorrect ? null : click.attemptNo,
            },
          }),
        );
      }

      ops.push(
        this.prisma.gameRunStep.update({
          where: { id: step.id },
          data: {
            isCorrect,
            wrongAttempts,
            hintsUsed,
            pointsAwarded,
            timeTaken: s.timeTaken,
          },
        }),
      );
    }

    // The batch is authoritative for this run's score (it was created at 0 and
    // never touched by the per-click flow), so set rather than increment. The
    // score is always the server-recomputed total — any client-reported score
    // is accepted at the DTO level but never read here.
    ops.push(
      this.prisma.gameRun.update({
        where: { id: runId },
        data: { score: totalAwarded, ...(carColourId ? { carColourId } : {}) },
      }),
    );

    await this.prisma.$transaction(ops);

    return this.completeRun(runId);
  }

  private async completeRun(runId: string) {
    const run = await this.prisma.gameRun.findUniqueOrThrow({
      where: { id: runId },
    });

    const band = await this.prisma.gameJudgementBand.findFirst({
      where: {
        flowId: run.flowId,
        minScore: { lte: run.score },
        maxScore: { gte: run.score },
      },
    });

    const completedAt = new Date();
    const durationSeconds = Math.round(
      (completedAt.getTime() - run.startedAt.getTime()) / 1000,
    );

    const completed = await this.prisma.$transaction(async (tx) => {
      // Mirror the result onto the shared kiosk session. Certificate-eligible
      // bands count as a "pass" so game visits read the same as quiz visits.
      await tx.participantSession.update({
        where: { id: run.sessionId },
        data: {
          status: 'COMPLETED',
          completedAt,
          durationSeconds,
          score: run.score,
          maxScore: run.maxScore,
          isPassed: band?.certificateEligible ?? false,
        },
      });

      return tx.gameRun.update({
        where: { id: runId },
        data: {
          status: 'COMPLETED',
          completedAt,
          timeTaken: durationSeconds,
          judgementBandId: band?.id ?? null,
        },
        include: {
          judgementBand: true,
          // Every step's every attempt, each flagged right/wrong — so the
          // caller (submitAnswer's finish, or submitBatch) sees the full
          // right/wrong trail without a separate getRun call.
          steps: {
            include: { events: { orderBy: { attemptNo: 'asc' } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    });

    // Place the finished run on the GAME leaderboard (own points-based board).
    await this.leaderboard.upsertGameEntry(runId);

    // Prisma can't alias a relation name, so rename events → answers here.
    const { steps, ...rest } = completed;
    return {
      ...rest,
      steps: steps.map(({ events, ...step }) => ({ ...step, answers: events })),
    };
  }

  async getRun(runId: string, participantId: string) {
    const run = await this.prisma.gameRun.findFirst({
      where: { id: runId, session: { participantId } },
      include: {
        judgementBand: true,
        carModel: { select: { code: true, name: true, imageUrl: true } },
        carColour: { select: { code: true, name: true, hex: true } },
        steps: {
          include: {
            events: true,
            question: {
              select: { id: true, stepNo: true, kind: true, correctProcessId: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!run) throw new NotFoundException('Game run not found');
    return run;
  }
}
