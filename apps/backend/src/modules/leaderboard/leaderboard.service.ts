import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeaderboardType, LeaderboardSource, Prisma } from '@prisma/client';
import { LEADERBOARD_DEFAULT_LIMIT } from '../../config/constants';
import { LeaderboardGateway } from './leaderboard.gateway';

@Injectable()
export class LeaderboardService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => LeaderboardGateway))
    private gateway: LeaderboardGateway,
  ) {}

  async getLeaderboard(
    type: LeaderboardType = 'GLOBAL',
    limit = LEADERBOARD_DEFAULT_LIMIT,
    designationId?: string,
    lineId?: string,
    plantId?: string,
    source: LeaderboardSource = 'QUIZ',
  ) {
    const where: Prisma.LeaderboardEntryWhereInput = {
      source,
      createdAt: this.periodFilter(type),
    };
    if (designationId) where.designationId = designationId;
    if (lineId) where.lineId = lineId;
    if (plantId) where.participant = { plantId };

    const entries = await this.prisma.leaderboardEntry.findMany({
      where,
      include: {
        participant: { select: { name: true, code: true, imageUrl: true, line: { select: { name: true } } } },
        designation: { select: { name: true } },
        attempt: { include: { session: { select: { durationSeconds: true } } } },
        gameRun: { include: { session: { select: { durationSeconds: true } } } },
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
      take: limit,
    });
    // Re-rank based on position in the filtered result set
    return entries.map((e, i) => ({ ...e, rank: i + 1 }));
  }

  private periodFilter(type: LeaderboardType): { gte: Date } | undefined {
    const now = new Date();
    if (type === 'DAILY') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { gte: start };
    }
    if (type === 'WEEKLY') {
      const start = new Date(now);
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)); // back to Monday
      start.setHours(0, 0, 0, 0);
      return { gte: start };
    }
    if (type === 'MONTHLY') {
      return { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    }
    return undefined; // GLOBAL — no date restriction
  }

  async upsertEntry(attemptId: string, _participantId: string, _sessionParticipantId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        session: { include: { participant: true } },
      },
    });
    if (!attempt) return;

    const participant = attempt.session.participant;

    const entry = await this.prisma.leaderboardEntry.upsert({
      where: { attemptId },
      create: {
        attemptId,
        source: 'QUIZ',
        participantId: participant.id,
        designationId: participant.designationId,
        lineId: attempt.session.lineId,
        score: attempt.score,
        percentage: attempt.percentage,
        rank: 0,
        type: 'GLOBAL',
      },
      update: {
        score: attempt.score,
        percentage: attempt.percentage,
      },
    });

    await this.recalculateRanks('GLOBAL', 'QUIZ');
    await this.gateway.broadcastUpdate();
    return entry;
  }

  /** Places a completed game run on the GAME leaderboard (points-based). */
  async upsertGameEntry(gameRunId: string) {
    const run = await this.prisma.gameRun.findUnique({
      where: { id: gameRunId },
      include: { session: { include: { participant: true } } },
    });
    if (!run || run.status !== 'COMPLETED') return;

    const participant = run.session.participant;
    const percentage = run.maxScore > 0 ? (run.score / run.maxScore) * 100 : 0;

    const entry = await this.prisma.leaderboardEntry.upsert({
      where: { gameRunId },
      create: {
        gameRunId,
        source: 'GAME',
        participantId: participant.id,
        designationId: participant.designationId,
        lineId: run.session.lineId,
        score: run.score,
        percentage,
        rank: 0,
        type: 'GLOBAL',
      },
      update: {
        score: run.score,
        percentage,
      },
    });

    await this.recalculateRanks('GLOBAL', 'GAME');
    await this.gateway.broadcastUpdate();
    return entry;
  }

  private async recalculateRanks(
    type: LeaderboardType,
    source: LeaderboardSource,
  ) {
    const entries = await this.prisma.leaderboardEntry.findMany({
      where: { type, source },
      orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
    });

    await this.prisma.$transaction(
      entries.map((e, index) =>
        this.prisma.leaderboardEntry.update({
          where: { id: e.id },
          data: { rank: index + 1 },
        }),
      ),
    );
  }

  async getTop10() {
    return this.getLeaderboard('GLOBAL', LEADERBOARD_DEFAULT_LIMIT);
  }
}
