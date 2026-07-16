import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DEFAULT_PAGE_SIZE } from '../../config/constants';
import { UpdateMeDto } from './dto/update-me.dto';
import { CreateParticipantAdminDto } from './dto/create-participant-admin.dto';
import { UpdateParticipantAdminDto } from './dto/update-participant-admin.dto';

const PARTICIPANT_INCLUDE = {
  designation: true,
  line: true,
  participantType: true,
  plant: true,
} as const;

@Injectable()
export class ParticipantService {
  constructor(private prisma: PrismaService) {}

  // ─── Shared lookup ──────────────────────────────────────────────────────────

  async findById(id: string) {
    const p = await this.prisma.participant.findUnique({
      where: { id },
      include: PARTICIPANT_INCLUDE,
    });
    if (!p) throw new NotFoundException(`Participant ${id} not found`);
    return p;
  }

  async findByCode(code: string) {
    const participant = await this.prisma.participant.findUnique({
      where: { code },
      include: PARTICIPANT_INCLUDE,
    });
    if (!participant)
      throw new NotFoundException(`Participant "${code}" not found`);
    return participant;
  }

  // ─── Admin CRUD ─────────────────────────────────────────────────────────────

  async findAllAdmin(
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search?: string,
    designationId?: string,
    lineId?: string,
    participantTypeId?: string,
    plantId?: string,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { code: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(designationId ? { designationId } : {}),
      ...(lineId ? { lineId } : {}),
      ...(participantTypeId ? { participantTypeId } : {}),
      ...(plantId ? { plantId } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.participant.findMany({
        skip,
        take: limit,
        where,
        include: PARTICIPANT_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.participant.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async createAdmin(dto: CreateParticipantAdminDto) {
    try {
      return await this.prisma.participant.create({
        data: dto,
        include: PARTICIPANT_INCLUDE,
      });
    } catch (e) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          `Participant with code "${dto.code}" already exists`,
        );
      }
      throw e;
    }
  }

  async updateAdmin(id: string, dto: UpdateParticipantAdminDto) {
    try {
      return await this.prisma.participant.update({
        where: { id },
        data: dto,
        include: PARTICIPANT_INCLUDE,
      });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e) {
        const code = (e as { code: string }).code;
        if (code === 'P2002') {
          throw new ConflictException(
            `Participant with code "${dto.code}" already exists`,
          );
        }
        if (code === 'P2025') {
          throw new NotFoundException(`Participant ${id} not found`);
        }
      }
      throw e;
    }
  }

  // Soft delete: keeps the row (and its session/certificate/game history)
  // intact for audit/reporting, just hides it from active lists and login.
  async removeAdmin(id: string) {
    try {
      return await this.prisma.participant.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'code' in e) {
        const code = (e as { code: string }).code;
        if (code === 'P2025') {
          throw new NotFoundException(`Participant ${id} not found`);
        }
      }
      throw e;
    }
  }

  // ─── Self-service (kiosk participant) ───────────────────────────────────────

  async findAll(page = 1, limit = DEFAULT_PAGE_SIZE) {
    const skip = (page - 1) * limit;
    const where = { isActive: true };
    const [data, total] = await Promise.all([
      this.prisma.participant.findMany({
        skip,
        take: limit,
        where,
        include: PARTICIPANT_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.participant.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async updateMe(participantId: string, dto: UpdateMeDto) {
    console.log('lineId:', dto.lineId);
    const updated = await this.prisma.participant.update({
      where: { id: participantId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.designationId !== undefined
          ? { designationId: dto.designationId }
          : {}),
        ...(dto.lineId !== undefined ? { lineId: dto.lineId } : {}),
        ...(dto.plantId !== undefined ? { plantId: dto.plantId } : {}),
      },
      include: PARTICIPANT_INCLUDE,
    });
    return {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      designation: updated.designation.name,
      designationId: updated.designationId,
      line: updated.line.name,
      lineId: updated.lineId,
      type: updated.participantType.name,
      plant: updated.plant?.name,
      plantId: updated.plantId,
      imageUrl: updated.imageUrl,
    };
  }

  async updatePhoto(participantId: string, imageUrl: string) {
    return this.prisma.participant.update({
      where: { id: participantId },
      data: { imageUrl },
      select: { id: true, code: true, name: true, imageUrl: true },
    });
  }

  async getAttemptReviewAdmin(attemptId: string, lang: string) {
    const language = await this.prisma.language.findFirst({
      where: { code: { equals: lang, mode: 'insensitive' }, isActive: true },
    });

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
    if (!attempt) throw new NotFoundException('Attempt not found');

    function pickText(
      translations: { languageId: string; text: string }[],
    ): string {
      return (
        (language &&
          translations.find((t) => t.languageId === language.id)?.text) ??
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
        ? {
            name: attempt.performanceLevel.name,
            color: attempt.performanceLevel.color ?? '#6b7280',
            code: attempt.performanceLevel.code,
          }
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

  async getSessionHistory(participantId: string) {
    const sessions = await this.prisma.participantSession.findMany({
      where: { participantId, kind: 'QUIZ', status: 'COMPLETED' },
      include: {
        attempts: {
          include: { performanceLevel: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { completedAt: 'desc' },
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
        isPassed: s.isPassed ?? false,
        performance: attempt?.performanceLevel
          ? {
              name: attempt.performanceLevel.name,
              color: attempt.performanceLevel.color ?? '#6b7280',
              code: attempt.performanceLevel.code,
            }
          : null,
      };
    });
  }

  async getCertificates(participantId: string) {
    return this.prisma.certificate.findMany({
      where: { participantId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async getStats(participantId: string) {
    const sessions = await this.prisma.participantSession.findMany({
      where: { participantId, kind: 'QUIZ', status: 'COMPLETED' },
      include: { attempts: { include: { performanceLevel: true } } },
      orderBy: { completedAt: 'desc' },
    });

    const attempts = sessions.flatMap((s) => s.attempts);
    const best = attempts.reduce(
      (max, a) => (a.percentage > (max?.percentage ?? 0) ? a : max),
      attempts[0],
    );

    return {
      totalSessions: sessions.length,
      totalAttempts: attempts.length,
      bestScore: best?.percentage ?? 0,
      bestPerformance: best?.performanceLevel?.name ?? null,
      lastActivity: sessions[0]?.completedAt ?? null,
    };
  }
}
