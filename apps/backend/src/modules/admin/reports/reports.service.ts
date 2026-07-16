import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SessionFilters } from '../interfaces/session-filters.interface';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';

@Injectable()
export class ReportsService {
  private readonly defaultPageSize: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.defaultPageSize = this.config.get<number>(
      'ADMIN_DEFAULT_PAGE_SIZE',
      DEFAULT_PAGE_SIZE,
    );
  }

  // Shared period→date-range resolver. Used by dashboard chart endpoints and the
  // report-overview export, so a future scheduled-email digest can request the
  // same DAILY/WEEKLY/MONTHLY/DATE_RANGE windows as the dashboard UI.
  private periodDateFilter(filters: {
    period?: string;
    from?: string;
    to?: string;
  }) {
    const now = new Date();
    if (filters.period === 'DAILY') {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      return { gte: from, lte: now };
    }
    if (filters.period === 'WEEKLY') {
      const from = new Date(now);
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return { gte: from, lte: now };
    }
    if (filters.period === 'MONTHLY') {
      return { gte: new Date(now.getFullYear(), now.getMonth(), 1), lte: now };
    }
    if (filters.period === 'DATE_RANGE' && (filters.from || filters.to)) {
      return {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }
    return undefined;
  }

  async getDashboard() {
    const now = new Date();

    // ── Date boundaries ────────────────────────────────────────────────────
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 7);
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 14);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── Parallel queries ───────────────────────────────────────────────────
    const [
      totalParticipants,
      participantsThisMonth,
      sessionsToday,
      sessionsYesterday,
      passedThisWeek,
      totalCompletedThisWeek,
      passedLastWeek,
      totalCompletedLastWeek,
      avgScoreThisWeek,
      avgScoreLastWeek,
      performanceLevels,
      totalAttempts,
      recentSessions,
      designations,
      plants,
      lines,
    ] = await Promise.all([
      this.prisma.participant.count({ where: { isActive: true } }),
      this.prisma.participant.count({
        where: { isActive: true, enteredAt: { gte: thisMonthStart } },
      }),

      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          completedAt: { gte: todayStart },
        },
      }),
      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          completedAt: { gte: yesterdayStart, lt: todayStart },
        },
      }),

      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          isPassed: true,
          completedAt: { gte: thisWeekStart },
        },
      }),
      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          completedAt: { gte: thisWeekStart },
        },
      }),
      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          isPassed: true,
          completedAt: { gte: lastWeekStart, lt: thisWeekStart },
        },
      }),
      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          completedAt: { gte: lastWeekStart, lt: thisWeekStart },
        },
      }),

      this.prisma.quizAttempt.aggregate({
        _avg: { percentage: true },
        where: {
          session: { status: 'COMPLETED', completedAt: { gte: thisWeekStart } },
        },
      }),
      this.prisma.quizAttempt.aggregate({
        _avg: { percentage: true },
        where: {
          session: {
            status: 'COMPLETED',
            completedAt: { gte: lastWeekStart, lt: thisWeekStart },
          },
        },
      }),

      this.prisma.performanceLevel.findMany({
        where: { isActive: true },
        include: { _count: { select: { attempts: true } } },
        orderBy: { minScore: 'desc' },
      }),
      this.prisma.quizAttempt.count(),

      this.prisma.participantSession.findMany({
        where: { kind: 'QUIZ', status: 'COMPLETED' },
        include: {
          participant: { include: { designation: true } },
          attempts: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),

      this.prisma.designation.findMany({
        where: { isActive: true },
        include: {
          participants: {
            include: {
              sessions: {
                where: { kind: 'QUIZ', status: 'COMPLETED' },
                select: {
                  isPassed: true,
                  attempts: {
                    select: { percentage: true },
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.plant.findMany({
        where: { isActive: true },
        include: {
          participants: {
            include: {
              sessions: {
                where: { kind: 'QUIZ', status: 'COMPLETED' },
                select: {
                  isPassed: true,
                  attempts: {
                    select: { percentage: true },
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),

      this.prisma.line.findMany({
        where: { isActive: true },
        include: {
          participants: {
            include: {
              sessions: {
                where: { kind: 'QUIZ', status: 'COMPLETED' },
                select: {
                  isPassed: true,
                  attempts: {
                    select: { percentage: true },
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);

    // ── KPI calculations ───────────────────────────────────────────────────
    const passRateNow =
      totalCompletedThisWeek > 0
        ? (passedThisWeek / totalCompletedThisWeek) * 100
        : 0;
    const passRatePrev =
      totalCompletedLastWeek > 0
        ? (passedLastWeek / totalCompletedLastWeek) * 100
        : 0;

    const avgNow = avgScoreThisWeek._avg.percentage ?? 0;
    const avgPrev = avgScoreLastWeek._avg.percentage ?? 0;

    const round1 = (n: number) => Math.round(n * 10) / 10;

    // ── Performance distribution ───────────────────────────────────────────
    const levels = performanceLevels.map((pl) => ({
      name: pl.name,
      code: pl.code,
      color: pl.color,
      count: pl._count.attempts,
      pct:
        totalAttempts > 0
          ? round1((pl._count.attempts / totalAttempts) * 100)
          : 0,
    }));

    // ── Designation stats ───────────────────────────────────────────────────
    const designationStats = designations.map((desg) => {
      const sessions = desg.participants.flatMap((p) => p.sessions);
      const allAttempts = sessions.flatMap((s) => s.attempts);
      const avgScore =
        allAttempts.length > 0
          ? allAttempts.reduce((sum, a) => sum + a.percentage, 0) /
            allAttempts.length
          : 0;
      const passRate =
        sessions.length > 0
          ? (sessions.filter((s) => s.isPassed).length / sessions.length) * 100
          : 0;
      return {
        name: desg.name,
        participants: desg.participants.length,
        avgScore: round1(avgScore),
        passRate: Math.round(passRate),
      };
    });

    // ── Plant stats ───────────────────────────────────────────────────
    const plantStats = plants.map((plant) => {
      const sessions = plant.participants.flatMap((p) => p.sessions);
      const allAttempts = sessions.flatMap((s) => s.attempts);
      const avgScore =
        allAttempts.length > 0
          ? allAttempts.reduce((sum, a) => sum + a.percentage, 0) /
            allAttempts.length
          : 0;
      const passRate =
        sessions.length > 0
          ? (sessions.filter((s) => s.isPassed).length / sessions.length) * 100
          : 0;
      return {
        name: plant.name,
        participants: plant.participants.length,
        avgScore: round1(avgScore),
        passRate: Math.round(passRate),
      };
    });


      // ── Line stats ───────────────────────────────────────────────────
    const lineStats = lines.map((line) => {
      const sessions = line.participants.flatMap((p) => p.sessions);
      const allAttempts = sessions.flatMap((s) => s.attempts);
      const avgScore =
        allAttempts.length > 0
          ? allAttempts.reduce((sum, a) => sum + a.percentage, 0) /
            allAttempts.length
          : 0;
      const passRate =
        sessions.length > 0
          ? (sessions.filter((s) => s.isPassed).length / sessions.length) * 100
          : 0;
      return {
        name: line.name,
        participants: line.participants.length,
        avgScore: round1(avgScore),
        passRate: Math.round(passRate),
      };
    });


    // ── Recent activity ────────────────────────────────────────────────────
    const recentActivity = recentSessions.map((s) => ({
      participantId: s.participantId,
      name: s.participant.name,
      desg: s.participant.designation.name,
      pct: round1(s.attempts[0]?.percentage ?? 0),
      passed: s.isPassed ?? false,
      completedAt: s.completedAt,
    }));

    return {
      kpis: {
        totalParticipants,
        participantsThisMonth,
        sessionsToday,
        sessionsYesterday,
        passRate: round1(passRateNow),
        passRateDelta: round1(passRateNow - passRatePrev),
        avgScore: round1(avgNow),
        avgScoreDelta: round1(avgNow - avgPrev),
      },
      performanceDistribution: { totalAttempts, levels },
      designationStats,
      plantStats,
      lineStats,
      recentActivity,
    };
  }

  async getDashboardMonthlyParticipants(filters: {
    year?: number;
    designationId?: string;
    plantId?: string;
    lineId?: string;
  }) {
    const now = new Date();
    const year =
      filters.year && filters.year >= 2000 && filters.year <= 2100
        ? filters.year
        : now.getFullYear();
    const from = new Date(year, 0, 1);
    const to = new Date(year + 1, 0, 1);

    const sessions = await this.prisma.participantSession.findMany({
      where: {
        kind: 'QUIZ',
        status: 'COMPLETED',
        completedAt: { gte: from, lt: to },
        participant: {
          ...(filters.designationId
            ? { designationId: filters.designationId }
            : {}),
          ...(filters.plantId ? { plantId: filters.plantId } : {}),
          ...(filters.lineId ? { lineId: filters.lineId } : {}),
        },
      },
      select: {
        participantId: true,
        completedAt: true,
      },
    });

    const monthSets = Array.from({ length: 12 }, () => new Set<string>());
    for (const session of sessions) {
      if (!session.completedAt) continue;
      monthSets[session.completedAt.getMonth()].add(session.participantId);
    }

    const monthLabels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const months = monthSets.map((set, index) => ({
      month: monthLabels[index],
      monthIndex: index + 1,
      participants: set.size,
    }));

    return {
      year,
      totalParticipants: new Set(
        sessions.map((session) => session.participantId),
      ).size,
      months,
    };
  }

  async getDashboardScoreBreakdown(filters: {
    period?: string;
    from?: string;
    to?: string;
    designationId?: string;
    plantId?: string;
    lineId?: string;
  }) {
    const completedAt = this.periodDateFilter(filters);

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        completedAt: { not: null },
        session: {
          status: 'COMPLETED',
          ...(completedAt ? { completedAt } : {}),
          participant: {
            ...(filters.designationId
              ? { designationId: filters.designationId }
              : {}),
            ...(filters.plantId ? { plantId: filters.plantId } : {}),
            ...(filters.lineId ? { lineId: filters.lineId } : {}),
          },
        },
      },
      select: { percentage: true },
    });

    const buckets = [
      {
        code: 'GT_80',
        label: '>80%',
        min: 80,
        max: Number.POSITIVE_INFINITY,
        color: '#16a34a',
        count: 0,
      },
      {
        code: 'SIXTY_80',
        label: '60-80%',
        min: 60,
        max: 80,
        color: '#3b82f6',
        count: 0,
      },
      {
        code: 'FORTY_60',
        label: '40-60%',
        min: 40,
        max: 60,
        color: '#f59e0b',
        count: 0,
      },
      {
        code: 'LT_40',
        label: '<40%',
        min: Number.NEGATIVE_INFINITY,
        max: 40,
        color: '#dc2626',
        count: 0,
      },
    ];

    for (const attempt of attempts) {
      const score = attempt.percentage;
      if (score > 80) buckets[0].count++;
      else if (score >= 60) buckets[1].count++;
      else if (score >= 40) buckets[2].count++;
      else buckets[3].count++;
    }

    const totalAttempts = attempts.length;
    const round1 = (n: number) => Math.round(n * 10) / 10;

    return {
      totalAttempts,
      buckets: buckets.map(({ min: _min, max: _max, ...bucket }) => ({
        ...bucket,
        pct:
          totalAttempts > 0 ? round1((bucket.count / totalAttempts) * 100) : 0,
      })),
    };
  }

  async getDashboardDesignationScoreBreakdown(filters: {
    period?: string;
    from?: string;
    to?: string;
  }) {
    const completedAt = this.periodDateFilter(filters);
    const designations = await this.prisma.designation.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    });

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        completedAt: { not: null },
        session: {
          status: 'COMPLETED',
          ...(completedAt ? { completedAt } : {}),
        },
      },
      select: {
        percentage: true,
        session: {
          select: { participant: { select: { designationId: true } } },
        },
      },
    });

    const bucketTemplate = [
      { code: 'GT_80', label: '>80%', color: '#16a34a' },
      { code: 'SIXTY_80', label: '60-80%', color: '#3b82f6' },
      { code: 'FORTY_60', label: '40-60%', color: '#f59e0b' },
      { code: 'LT_40', label: '<40%', color: '#dc2626' },
    ];

    const map = new Map(
      designations.map((designation) => [
        designation.id,
        {
          id: designation.id,
          name: designation.name,
          totalAttempts: 0,
          buckets: bucketTemplate.map((bucket) => ({ ...bucket, count: 0 })),
        },
      ]),
    );

    for (const attempt of attempts) {
      const row = map.get(attempt.session.participant.designationId);
      if (!row) continue;
      row.totalAttempts++;
      if (attempt.percentage > 80) row.buckets[0].count++;
      else if (attempt.percentage >= 60) row.buckets[1].count++;
      else if (attempt.percentage >= 40) row.buckets[2].count++;
      else row.buckets[3].count++;
    }

    return {
      totalAttempts: attempts.length,
      designations: Array.from(map.values()).filter(
        (row) => row.totalAttempts > 0,
      ),
      buckets: bucketTemplate,
    };
  }

  async getDashboardLineDistribution(filters: {
    period?: string;
    from?: string;
    to?: string;
  }) {
    const completedAt = this.periodDateFilter(filters);
    const lines = await this.prisma.line.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    });

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        completedAt: { not: null },
        session: {
          status: 'COMPLETED',
          ...(completedAt ? { completedAt } : {}),
        },
      },
      select: {
        percentage: true,
        session: {
          select: {
            lineId: true,
            participant: { select: { lineId: true } },
          },
        },
      },
    });

    const colors = [
      '#EB0A1E',
      '#3b82f6',
      '#16a34a',
      '#f59e0b',
      '#8b5cf6',
      '#14b8a6',
      '#ec4899',
      '#64748b',
    ];
    const map = new Map(
      lines.map((line, index) => [
        line.id,
        {
          id: line.id,
          name: line.name,
          color: colors[index % colors.length],
          count: 0,
          scoreTotal: 0,
        },
      ]),
    );

    for (const attempt of attempts) {
      const lineId =
        attempt.session.lineId ?? attempt.session.participant.lineId;
      if (!lineId) continue;
      const row = map.get(lineId);
      if (!row) continue;
      row.count++;
      row.scoreTotal += attempt.percentage;
    }

    const totalAttempts = Array.from(map.values()).reduce(
      (sum, line) => sum + line.count,
      0,
    );
    const round1 = (n: number) => Math.round(n * 10) / 10;

    return {
      totalAttempts,
      lines: Array.from(map.values())
        .filter((line) => line.count > 0)
        .map((line) => ({
          id: line.id,
          name: line.name,
          color: line.color,
          count: line.count,
          pct:
            totalAttempts > 0 ? round1((line.count / totalAttempts) * 100) : 0,
          avgScore: line.count > 0 ? round1(line.scoreTotal / line.count) : 0,
        })),
    };
  }

  async getReportOverview(filters: {
    designation?: string;
    plant?: string;
    line?: string;
    days?: number;
    period?: string;
    from?: string;
    to?: string;
  }) {
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - 7);
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 14);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const participantFilter = {
      isActive: true,
      ...(filters.designation
        ? { designation: { name: filters.designation } }
        : {}),
      ...(filters.plant ? { plant: { name: filters.plant } } : {}),
      ...(filters.line ? { line: { name: filters.line } } : {}),
    };
    const hasParticipantFilter = Object.keys(participantFilter).length > 1;

    // Cross-filters for the per-dimension breakdown tables: each table excludes
    // its own dimension (already pinned by the group being iterated) but still
    // honours the *other* selected filters.
    const designationCrossFilter = {
      ...(filters.plant ? { plant: { name: filters.plant } } : {}),
      ...(filters.line ? { line: { name: filters.line } } : {}),
    };
    const plantCrossFilter = {
      ...(filters.designation
        ? { designation: { name: filters.designation } }
        : {}),
      ...(filters.line ? { line: { name: filters.line } } : {}),
    };
    const lineCrossFilter = {
      ...(filters.designation
        ? { designation: { name: filters.designation } }
        : {}),
      ...(filters.plant ? { plant: { name: filters.plant } } : {}),
    };

    const periodRange = this.periodDateFilter({
      period: filters.period,
      from: filters.from,
      to: filters.to,
    });
    const rangeFilter =
      periodRange ??
      (filters.days
        ? { gte: new Date(now.getTime() - filters.days * 24 * 60 * 60 * 1000) }
        : undefined);

    const attemptWhere = {
      ...(rangeFilter ? { completedAt: rangeFilter } : {}),
      session: { participant: participantFilter },
    };

    const groupSessionsWhere = {
      kind: 'QUIZ' as const,
      status: 'COMPLETED' as const,
      ...(rangeFilter ? { completedAt: rangeFilter } : {}),
    };
    const groupSessionsSelect = {
      isPassed: true,
      attempts: {
        select: { percentage: true },
        take: 1,
        orderBy: { createdAt: 'desc' as const },
      },
    };

    const [
      totalParticipants,
      participantsThisMonth,
      sessionsToday,
      sessionsYesterday,
      passedThisWeek,
      totalCompletedThisWeek,
      passedLastWeek,
      totalCompletedLastWeek,
      avgScoreThisWeek,
      avgScoreLastWeek,
      performanceLevels,
      totalAttempts,
      designations,
      plants,
      lines,
      topPerformers,
      hardestQuestions,
    ] = await Promise.all([
      this.prisma.participant.count({ where: participantFilter }),
      this.prisma.participant.count({
        where: { ...participantFilter, enteredAt: { gte: thisMonthStart } },
      }),

      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          completedAt: { gte: todayStart },
          participant: participantFilter,
        },
      }),
      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          completedAt: { gte: yesterdayStart, lt: todayStart },
          participant: participantFilter,
        },
      }),

      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          isPassed: true,
          completedAt: { gte: thisWeekStart },
          participant: participantFilter,
        },
      }),
      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          completedAt: { gte: thisWeekStart },
          participant: participantFilter,
        },
      }),
      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          isPassed: true,
          completedAt: { gte: lastWeekStart, lt: thisWeekStart },
          participant: participantFilter,
        },
      }),
      this.prisma.participantSession.count({
        where: {
          kind: 'QUIZ',
          status: 'COMPLETED',
          completedAt: { gte: lastWeekStart, lt: thisWeekStart },
          participant: participantFilter,
        },
      }),

      this.prisma.quizAttempt.aggregate({
        _avg: { percentage: true },
        where: {
          session: {
            status: 'COMPLETED',
            completedAt: { gte: thisWeekStart },
            participant: participantFilter,
          },
        },
      }),
      this.prisma.quizAttempt.aggregate({
        _avg: { percentage: true },
        where: {
          session: {
            status: 'COMPLETED',
            completedAt: { gte: lastWeekStart, lt: thisWeekStart },
            participant: participantFilter,
          },
        },
      }),

      this.prisma.performanceLevel.findMany({
        where: { isActive: true },
        include: { _count: { select: { attempts: { where: attemptWhere } } } },
        orderBy: { minScore: 'desc' },
      }),
      this.prisma.quizAttempt.count({ where: attemptWhere }),

      this.prisma.designation.findMany({
        where: { isActive: true },
        include: {
          participants: {
            where: designationCrossFilter,
            include: {
              sessions: {
                where: groupSessionsWhere,
                select: groupSessionsSelect,
              },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.plant.findMany({
        where: { isActive: true },
        include: {
          participants: {
            where: plantCrossFilter,
            include: {
              sessions: {
                where: groupSessionsWhere,
                select: groupSessionsSelect,
              },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.line.findMany({
        where: { isActive: true },
        include: {
          participants: {
            where: lineCrossFilter,
            include: {
              sessions: {
                where: groupSessionsWhere,
                select: groupSessionsSelect,
              },
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),

      this.getTopPerformers(
        5,
        filters.designation,
        filters.plant,
        filters.line,
        rangeFilter,
      ),
      this.getHardestQuestions(5, {
        designation: filters.designation,
        plant: filters.plant,
        line: filters.line,
        rangeFilter,
      }),
    ]);

    // ── KPI calculations ───────────────────────────────────────────────────
    const passRateNow =
      totalCompletedThisWeek > 0
        ? (passedThisWeek / totalCompletedThisWeek) * 100
        : 0;
    const passRatePrev =
      totalCompletedLastWeek > 0
        ? (passedLastWeek / totalCompletedLastWeek) * 100
        : 0;

    const avgNow = avgScoreThisWeek._avg.percentage ?? 0;
    const avgPrev = avgScoreLastWeek._avg.percentage ?? 0;

    // ── Performance distribution ───────────────────────────────────────────
    const levels = performanceLevels.map((pl) => ({
      name: pl.name,
      code: pl.code,
      color: pl.color,
      count: pl._count.attempts,
      pct:
        totalAttempts > 0
          ? round1((pl._count.attempts / totalAttempts) * 100)
          : 0,
    }));

    // ── Group (designation/plant/line) stats ───────────────────────────────
    const groupStats = (
      sessions: {
        isPassed: boolean | null;
        attempts: { percentage: number }[];
      }[],
    ) => {
      const allAttempts = sessions.flatMap((s) => s.attempts);
      const avgScore =
        allAttempts.length > 0
          ? allAttempts.reduce((sum, a) => sum + a.percentage, 0) /
            allAttempts.length
          : 0;
      const passRate =
        sessions.length > 0
          ? (sessions.filter((s) => s.isPassed).length / sessions.length) * 100
          : 0;
      return { avgScore: round1(avgScore), passRate: Math.round(passRate) };
    };

    const designationStats = designations.map((desg) => ({
      name: desg.name,
      participants: desg.participants.length,
      ...groupStats(desg.participants.flatMap((p) => p.sessions)),
    }));

    const plantStats = plants.map((plant) => ({
      name: plant.name,
      participants: plant.participants.length,
      ...groupStats(plant.participants.flatMap((p) => p.sessions)),
    }));

    const lineStats = lines.map((line) => {
      const sessions = line.participants.flatMap((p) => p.sessions);
      return {
        id: line.id,
        name: line.name,
        code: line.code,
        participants: line.participants.length,
        attempts: sessions.length,
        ...groupStats(sessions),
      };
    });

    return {
      kpis: {
        totalParticipants,
        participantsThisMonth,
        sessionsToday,
        sessionsYesterday,
        passRate: round1(passRateNow),
        passRateDelta: round1(passRateNow - passRatePrev),
        avgScore: round1(avgNow),
        avgScoreDelta: round1(avgNow - avgPrev),
      },
      performanceDistribution: { totalAttempts, levels },
      designationStats,
      plantStats,
      lineStats,
      topPerformers,
      hardestQuestions,
    };
  }

  async getOverview() {
    const [totalParticipants, totalSessions, completedSessions, avgScore] =
      await Promise.all([
        this.prisma.participant.count({ where: { isActive: true } }),
        this.prisma.participantSession.count({ where: { kind: 'QUIZ' } }),
        this.prisma.participantSession.count({
          where: { kind: 'QUIZ', status: 'COMPLETED' },
        }),
        this.prisma.quizAttempt.aggregate({ _avg: { percentage: true } }),
      ]);

    const byPerformance = await this.prisma.performanceLevel.findMany({
      where: { isActive: true },
      include: { _count: { select: { attempts: true } } },
    });

    return {
      totalParticipants,
      totalSessions,
      completedSessions,
      completionRate:
        totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      averageScore: avgScore._avg.percentage ?? 0,
      byPerformance: byPerformance.map((p) => ({
        name: p.name,
        code: p.code,
        color: p.color,
        count: p._count.attempts,
      })),
    };
  }

  async getSessions(filters: SessionFilters) {
    const {
      page = 1,
      limit = this.defaultPageSize,
      designationId,
      plantId,
      lineId,
      status,
      period,
      from,
      to,
    } = filters;
    const skip = (page - 1) * limit;

    const periodRange = this.periodDateFilter({ period, from, to });
    const rangeFilter =
      periodRange ??
      (from || to
        ? {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          }
        : undefined);

    const participantFilter = {
      ...(designationId ? { designationId } : {}),
      ...(plantId ? { plantId } : {}),
      ...(lineId ? { lineId } : {}),
    };

    const where = {
      kind: 'QUIZ' as const,
      ...(status
        ? { status: status as 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'FAILED' }
        : {}),
      ...(Object.keys(participantFilter).length > 0
        ? { participant: participantFilter }
        : {}),
      ...(rangeFilter ? { startedAt: rangeFilter } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.participantSession.findMany({
        where,
        skip,
        take: limit,
        include: {
          participant: { include: { designation: true, line: true } },
          attempts: {
            include: { performanceLevel: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.participantSession.count({ where }),
    ]);

    return { data, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getTrend(days = 30) {
    const now = new Date();
    const from = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - (days - 1),
    );

    const sessions = await this.prisma.participantSession.findMany({
      where: { kind: 'QUIZ', status: 'COMPLETED', completedAt: { gte: from } },
      select: { completedAt: true, isPassed: true },
    });

    const map = new Map<string, { passed: number; failed: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      map.set(d.toISOString().split('T')[0], { passed: 0, failed: 0 });
    }
    for (const s of sessions) {
      if (!s.completedAt) continue;
      const key = s.completedAt.toISOString().split('T')[0];
      const entry = map.get(key);
      if (entry) {
        if (s.isPassed) entry.passed++;
        else entry.failed++;
      }
    }
    return Array.from(map.entries()).map(([date, { passed, failed }]) => ({
      date,
      passed,
      failed,
      count: passed + failed,
    }));
  }

  async getTopPerformers(
    limit = 5,
    designationName?: string,
    plantName?: string,
    lineName?: string,
    completedAtFilter?: { gte?: Date; lte?: Date },
  ) {
    const participants = await this.prisma.participant.findMany({
      where: {
        isActive: true,
        ...(designationName ? { designation: { name: designationName } } : {}),
        ...(plantName ? { plant: { name: plantName } } : {}),
        ...(lineName ? { line: { name: lineName } } : {}),
      },
      include: {
        sessions: {
          where: {
            kind: 'QUIZ',
            status: 'COMPLETED',
            ...(completedAtFilter ? { completedAt: completedAtFilter } : {}),
          },
          include: { attempts: { select: { percentage: true } } },
        },
        designation: true,
      },
    });
    const round1 = (n: number) => Math.round(n * 10) / 10;
    return participants
      .map((p) => {
        const all = p.sessions.flatMap((s) => s.attempts);
        if (!all.length) return null;
        const avgScore = round1(
          all.reduce((s, a) => s + a.percentage, 0) / all.length,
        );
        const parts = p.name.trim().split(/\s+/);
        const initials =
          parts.length === 1
            ? parts[0].slice(0, 2).toUpperCase()
            : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return {
          id: p.id,
          name: p.name,
          code: p.code,
          desg: p.designation.name,
          avgScore,
          attempts: all.length,
          initials,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, limit);
  }

  async getHardestQuestions(
    limit = 5,
    filters: {
      designation?: string;
      plant?: string;
      line?: string;
      rangeFilter?: { gte?: Date; lte?: Date };
    } = {},
  ) {
    const conditions: Prisma.Sql[] = [];
    if (filters.rangeFilter?.gte) {
      conditions.push(
        Prisma.sql`ps."completedAt" >= ${filters.rangeFilter.gte}`,
      );
    }
    if (filters.rangeFilter?.lte) {
      conditions.push(
        Prisma.sql`ps."completedAt" <= ${filters.rangeFilter.lte}`,
      );
    }
    if (filters.designation) {
      conditions.push(Prisma.sql`d.name = ${filters.designation}`);
    }
    if (filters.plant) {
      conditions.push(Prisma.sql`pl.name = ${filters.plant}`);
    }
    if (filters.line) {
      conditions.push(Prisma.sql`l.name = ${filters.line}`);
    }
    const whereClause =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      {
        questionId: string;
        total: bigint;
        correct: bigint;
        correctRate: number;
      }[]
    >`
      SELECT qa."questionId",
             COUNT(*)::bigint AS total,
             SUM(CASE WHEN qa."isCorrect" THEN 1 ELSE 0 END)::bigint AS correct,
             ROUND(SUM(CASE WHEN qa."isCorrect" THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(*), 1) AS "correctRate"
      FROM "QuizAnswer" qa
      JOIN "QuizAttempt" att ON att.id = qa."attemptId"
      JOIN "ParticipantSession" ps ON ps.id = att."sessionId"
      JOIN "Participant" p ON p.id = ps."participantId"
      LEFT JOIN "Designation" d ON d.id = p."designationId"
      LEFT JOIN "Plant" pl ON pl.id = p."plantId"
      LEFT JOIN "Line" l ON l.id = p."lineId"
      ${whereClause}
      GROUP BY qa."questionId"
      HAVING COUNT(*) >= 5
      ORDER BY "correctRate" ASC
      LIMIT ${limit}
    `;
    if (!rows.length) return [];
    const qIds = rows.map((r) => r.questionId);
    const questions = await this.prisma.question.findMany({
      where: { id: { in: qIds } },
      include: { translations: { include: { language: true } } },
    });
    const qMap = new Map(questions.map((q) => [q.id, q]));
    const typeMap: Record<string, string> = {
      SINGLE_CHOICE: 'SC',
      MULTIPLE_CHOICE: 'MC',
      TRUE_FALSE: 'TF',
    };
    return rows.map((r) => {
      const q = qMap.get(r.questionId);
      const text =
        (
          q?.translations.find((t) => t.language.code === 'en') ??
          q?.translations[0]
        )?.text ?? '—';
      return {
        id: r.questionId,
        text,
        type: typeMap[q?.type ?? 'SINGLE_CHOICE'] ?? 'SC',
        difficulty: q?.difficulty ?? null,
        attempts: Number(r.total),
        correctRate: Number(r.correctRate),
      };
    });
  }

  async getLineStats() {
    const [lines, sessions] = await Promise.all([
      this.prisma.line.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.participantSession.findMany({
        where: { kind: 'QUIZ', status: 'COMPLETED', lineId: { not: null } },
        select: {
          lineId: true,
          isPassed: true,
          attempts: {
            select: { percentage: true },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);
    const round1 = (n: number) => Math.round(n * 10) / 10;
    return lines.map((line) => {
      const ls = sessions.filter((s) => s.lineId === line.id);
      const all = ls.flatMap((s) => s.attempts);
      const avgScore = all.length
        ? round1(all.reduce((s, a) => s + a.percentage, 0) / all.length)
        : 0;
      const passRate = ls.length
        ? Math.round((ls.filter((s) => s.isPassed).length / ls.length) * 100)
        : 0;
      return {
        id: line.id,
        name: line.name,
        code: line.code,
        attempts: ls.length,
        avgScore,
        passRate,
      };
    });
  }

  async getParticipantRankings(params: {
    page?: number;
    limit?: number;
    search?: string;
    designationId?: string;
    lineId?: string;
    plantId?: string;
    performanceLevelCode?: string;
    sortBy?: string;
    sortDir?: string;
  }) {
    const {
      page = 1,
      limit = this.defaultPageSize,
      search,
      designationId,
      lineId,
      plantId,
      performanceLevelCode,
      sortBy = 'avgScore',
      sortDir = 'desc',
    } = params;
    const round1 = (n: number) => Math.round(n * 10) / 10;

    const [participants, performanceLevels] = await Promise.all([
      this.prisma.participant.findMany({
        where: {
          isActive: true,
          ...(designationId ? { designationId } : {}),
          ...(lineId ? { lineId } : {}),
          ...(plantId ? { plantId } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { code: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        include: {
          designation: { select: { id: true, name: true } },
          line: { select: { id: true, name: true } },
          sessions: {
            where: { kind: 'QUIZ', status: 'COMPLETED' },
            select: {
              isPassed: true,
              completedAt: true,
              attempts: {
                select: {
                  percentage: true,
                  performanceLevel: {
                    select: { name: true, code: true, color: true },
                  },
                },
                orderBy: { createdAt: 'desc' },
              },
            },
            orderBy: { completedAt: 'desc' },
          },
        },
      }),
      this.prisma.performanceLevel.findMany({
        where: { isActive: true },
        orderBy: { minScore: 'desc' },
        select: { name: true, code: true, color: true },
      }),
    ]);

    let rows = participants
      .map((p) => {
        const allAttempts = p.sessions.flatMap((s) => s.attempts);
        if (!allAttempts.length) return null;
        const avgScore = round1(
          allAttempts.reduce((s, a) => s + a.percentage, 0) /
            allAttempts.length,
        );
        const bestScore = round1(
          Math.max(...allAttempts.map((a) => a.percentage)),
        );
        const passRate = Math.round(
          p.sessions.length > 0
            ? (p.sessions.filter((s) => s.isPassed).length /
                p.sessions.length) *
                100
            : 0,
        );
        const lastAttempt = p.sessions[0]?.completedAt?.toISOString() ?? null;
        const deltaScore =
          allAttempts.length >= 2
            ? round1(allAttempts[0].percentage - allAttempts[1].percentage)
            : 0;
        const latestPerf = allAttempts[0]?.performanceLevel;
        const parts = p.name.trim().split(/\s+/);
        const initials =
          parts.length === 1
            ? parts[0].slice(0, 2).toUpperCase()
            : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return {
          id: p.id,
          name: p.name,
          code: p.code,
          initials,
          designation: p.designation.name,
          designationId: p.designation.id,
          line: p.line.name,
          lineId: p.line.id,
          attempts: allAttempts.length,
          passRate,
          avgScore,
          bestScore,
          lastAttempt,
          deltaScore,
          performance: latestPerf?.name ?? 'Unrated',
          performanceCode: latestPerf?.code ?? 'UNRATED',
          performanceColor: latestPerf?.color ?? '#6b7280',
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (performanceLevelCode) {
      rows = rows.filter((r) => r.performanceCode === performanceLevelCode);
    }

    // Rank by avgScore desc (stable rank regardless of current sort)
    const rankSorted = [...rows].sort((a, b) => b.avgScore - a.avgScore);
    const rankMap = new Map(rankSorted.map((r, i) => [r.id, i + 1]));
    const rankedRows = rows.map((r) => ({
      ...r,
      rank: rankMap.get(r.id) ?? 0,
    }));

    // KPIs (pre-pagination)
    const totalLearners = rankedRows.length;
    const passingLearners = rankedRows.filter((r) => r.avgScore >= 65).length;
    const avgScoreAll =
      totalLearners > 0
        ? round1(rankedRows.reduce((s, r) => s + r.avgScore, 0) / totalLearners)
        : 0;
    const mostImproved =
      rankedRows.length > 0
        ? rankedRows.reduce((best, r) =>
            r.deltaScore > best.deltaScore ? r : best,
          )
        : null;

    // Sort
    const dir = sortDir === 'asc' ? 1 : -1;
    rankedRows.sort((a, b) => {
      const av = a[sortBy as keyof typeof a];
      const bv = b[sortBy as keyof typeof b];
      if (typeof av === 'string' && typeof bv === 'string')
        return av.localeCompare(bv) * dir;
      return ((av as number) - (bv as number)) * dir;
    });

    const total = rankedRows.length;
    const data = rankedRows.slice((page - 1) * limit, page * limit);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      kpis: {
        totalLearners,
        passingLearners,
        avgScoreAll,
        mostImproved: mostImproved
          ? {
              name: mostImproved.name,
              code: mostImproved.code,
              deltaScore: mostImproved.deltaScore,
            }
          : null,
      },
      performanceLevels: performanceLevels.map((level) => ({
        label: level.name,
        code: level.code,
        color: level.color ?? '#6b7280',
      })),
    };
  }

  async getParticipantReportDetail(participantId: string) {
    const round1 = (n: number) => Math.round(n * 10) / 10;

    // Phase 1: ranking data + participant detail data in parallel
    const [allForRanking, targetSessions] = await Promise.all([
      this.prisma.participant.findMany({
        where: { isActive: true },
        select: {
          id: true,
          designationId: true,
          lineId: true,
          sessions: {
            where: { kind: 'QUIZ', status: 'COMPLETED' },
            select: { attempts: { select: { percentage: true } } },
          },
        },
      }),
      this.prisma.participantSession.findMany({
        where: { participantId, kind: 'QUIZ', status: 'COMPLETED' },
        select: {
          completedAt: true,
          attempts: {
            select: {
              percentage: true,
              isPassed: true,
              completedAt: true,
              performanceLevel: {
                select: { name: true, code: true, color: true },
              },
              answers: {
                select: {
                  questionId: true,
                  isCorrect: true,
                  question: {
                    select: {
                      type: true,
                      translations: {
                        select: {
                          text: true,
                          language: { select: { code: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { completedAt: 'asc' },
      }),
    ]);

    const current = allForRanking.find((p) => p.id === participantId);
    if (!current) return null;

    const { designationId, lineId } = current;

    // Rankings
    const withAvg = allForRanking
      .map((p) => {
        const all = p.sessions.flatMap((s) => s.attempts);
        if (!all.length) return null;
        return {
          id: p.id,
          designationId: p.designationId,
          lineId: p.lineId,
          avgScore: round1(
            all.reduce((s, a) => s + a.percentage, 0) / all.length,
          ),
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.avgScore - a.avgScore);

    const overallRank = withAvg.findIndex((p) => p.id === participantId) + 1;
    const desgRanked = withAvg.filter((p) => p.designationId === designationId);
    const lineRanked = withAvg.filter((p) => p.lineId === lineId);
    const desgRank = desgRanked.findIndex((p) => p.id === participantId) + 1;
    const lineRank = lineRanked.findIndex((p) => p.id === participantId) + 1;

    // Phase 2: desg + line avg aggregates
    const [desgAvgAgg, lineAvgAgg, performanceLevels] = await Promise.all([
      this.prisma.quizAttempt.aggregate({
        _avg: { percentage: true },
        where: {
          session: { status: 'COMPLETED', participant: { designationId } },
        },
      }),
      lineId
        ? this.prisma.quizAttempt.aggregate({
            _avg: { percentage: true },
            where: { session: { status: 'COMPLETED', lineId } },
          })
        : Promise.resolve({ _avg: { percentage: null } }),
      this.prisma.performanceLevel.findMany({
        where: { isActive: true },
        orderBy: { minScore: 'desc' },
        select: { name: true, code: true, color: true },
      }),
    ]);

    // Process attempt-level data
    const allAttempts = targetSessions.flatMap((s) => s.attempts);

    // Performance distribution
    const perfMap = new Map<
      string,
      { name: string; code: string; color: string; count: number }
    >();
    for (const a of allAttempts) {
      if (a.performanceLevel) {
        const key = a.performanceLevel.code;
        if (!perfMap.has(key)) {
          perfMap.set(key, {
            name: a.performanceLevel.name,
            code: key,
            color: a.performanceLevel.color ?? '#6b7280',
            count: 0,
          });
        }
        perfMap.get(key)!.count++;
      }
    }

    // Weak topics: questions this participant answered wrong most often
    const answersByQ = new Map<
      string,
      { text: string; type: string; total: number; correct: number }
    >();
    const typeMap: Record<string, string> = {
      SINGLE_CHOICE: 'SC',
      MULTIPLE_CHOICE: 'MC',
      TRUE_FALSE: 'TF',
    };
    for (const a of allAttempts) {
      for (const ans of a.answers) {
        if (!answersByQ.has(ans.questionId)) {
          const text =
            (
              ans.question.translations.find((t) => t.language.code === 'en') ??
              ans.question.translations[0]
            )?.text ?? '—';
          answersByQ.set(ans.questionId, {
            text,
            type: typeMap[ans.question.type] ?? 'SC',
            total: 0,
            correct: 0,
          });
        }
        const entry = answersByQ.get(ans.questionId)!;
        entry.total++;
        if (ans.isCorrect) entry.correct++;
      }
    }

    const weakTopics = Array.from(answersByQ.entries())
      .map(([id, w]) => ({
        id,
        text: w.text,
        type: w.type,
        attempts: w.total,
        correctRate: w.total > 0 ? Math.round((w.correct / w.total) * 100) : 0,
      }))
      .sort((a, b) => a.correctRate - b.correctRate)
      .slice(0, 5);

    // Score trend per attempt
    const trendData = targetSessions
      .flatMap((s) =>
        s.attempts.map((a) => ({
          date: (a.completedAt ?? s.completedAt)?.toISOString() ?? null,
          score: round1(a.percentage),
          passed: a.isPassed,
        })),
      )
      .filter((d): d is typeof d & { date: string } => d.date !== null);

    return {
      ranks: {
        overall: overallRank || null,
        desg: desgRank || null,
        line: lineRank || null,
        totalLearners: withAvg.length,
        desgLearners: desgRanked.length,
        lineLearners: lineRanked.length,
      },
      performanceDistribution: performanceLevels.map((level) => ({
        name: level.name,
        code: level.code,
        color: level.color ?? '#6b7280',
        count: perfMap.get(level.code)?.count ?? 0,
      })),
      weakTopics,
      trendData,
      desgAvg: round1(desgAvgAgg._avg.percentage ?? 0),
      lineAvg: round1(lineAvgAgg._avg.percentage ?? 0),
    };
  }

  async getDesignationStats() {
    const designations = await this.prisma.designation.findMany({
      include: {
        participants: {
          include: {
            sessions: {
              where: { kind: 'QUIZ', status: 'COMPLETED' },
              include: { attempts: true },
            },
          },
        },
      },
    });

    return designations.map((desg) => {
      const allAttempts = desg.participants.flatMap((p) =>
        p.sessions.flatMap((s) => s.attempts),
      );
      const avgScore =
        allAttempts.length > 0
          ? allAttempts.reduce((sum, a) => sum + a.percentage, 0) /
            allAttempts.length
          : 0;

      return {
        id: desg.id,
        name: desg.name,
        code: desg.code,
        participantCount: desg.participants.length,
        totalAttempts: allAttempts.length,
        averageScore: Math.round(avgScore * 100) / 100,
      };
    });
  }
}
