import { Test, TestingModule } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardGateway } from './leaderboard.gateway';
import { PrismaService } from '../../prisma/prisma.service';
import { createPrismaMock, PrismaMock } from '../../test/prisma.mock';
import { LEADERBOARD_DEFAULT_LIMIT } from '../../config/constants';

// ── Factories ─────────────────────────────────────────────────────────────────

const makeParticipant = () => ({
  id: faker.string.uuid(),
  code: faker.string.alphanumeric(6).toUpperCase(),
  name: faker.person.fullName(),
  designationId: faker.string.uuid(),
  lineId: faker.string.uuid(),
  participantTypeId: faker.string.uuid(),
  role: 'USER' as const,
  imageUrl: null,
  enteredAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeAttemptWithSession = (participant = makeParticipant()) => ({
  id: faker.string.uuid(),
  sessionId: faker.string.uuid(),
  score: faker.number.int({ min: 0, max: 100 }),
  maxScore: 100,
  percentage: faker.number.float({ min: 0, max: 100 }),
  isPassed: true,
  totalQuestions: 10,
  correctAnswers: 7,
  performanceLevelId: null,
  completedAt: new Date(),
  startedAt: new Date(),
  createdAt: new Date(),
  session: {
    id: faker.string.uuid(),
    lineId: faker.string.uuid(),
    participant,
  },
});

const makeLeaderboardEntry = (overrides = {}) => ({
  id: faker.string.uuid(),
  source: 'QUIZ' as const,
  attemptId: faker.string.uuid(),
  gameRunId: null,
  participantId: faker.string.uuid(),
  designationId: faker.string.uuid(),
  lineId: null,
  score: faker.number.int({ min: 0, max: 100 }),
  percentage: faker.number.float({ min: 0, max: 100 }),
  rank: 1,
  type: 'GLOBAL' as const,
  createdAt: new Date(),
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let prisma: PrismaMock;
  let gateway: jest.Mocked<LeaderboardGateway>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    gateway = { broadcastUpdate: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<LeaderboardGateway>;

    // Default: $transaction with array executes all operations
    prisma.$transaction.mockImplementation((ops: unknown) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      if (typeof ops === 'function') return ops(prisma);
      return Promise.resolve();
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: PrismaService, useValue: prisma },
        { provide: LeaderboardGateway, useValue: gateway },
      ],
    }).compile();

    service = module.get(LeaderboardService);
  });

  // ── getLeaderboard ───────────────────────────────────────────────────────────

  describe('getLeaderboard', () => {
    it('queries with no date restriction for GLOBAL type and default limit', async () => {
      prisma.leaderboardEntry.findMany.mockResolvedValue([]);

      await service.getLeaderboard();

      expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: undefined, source: 'QUIZ' },
          take: LEADERBOARD_DEFAULT_LIMIT,
        }),
      );
    });

    it('respects custom limit and applies date filter for DAILY type', async () => {
      prisma.leaderboardEntry.findMany.mockResolvedValue([]);

      await service.getLeaderboard('DAILY', 5);

      expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: { gte: expect.any(Date) }, source: 'QUIZ' },
          take: 5,
        }),
      );
    });

    it('orders by score descending then createdAt ascending', async () => {
      prisma.leaderboardEntry.findMany.mockResolvedValue([]);

      await service.getLeaderboard();

      expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
        }),
      );
    });

    it('returns the entries with ranks reassigned by position', async () => {
      const entries = [makeLeaderboardEntry(), makeLeaderboardEntry()];
      prisma.leaderboardEntry.findMany.mockResolvedValue(entries);

      const result = await service.getLeaderboard();

      expect(result).toEqual(entries.map((e, i) => ({ ...e, rank: i + 1 })));
    });
  });

  // ── getTop10 ─────────────────────────────────────────────────────────────────

  describe('getTop10', () => {
    it('calls getLeaderboard with GLOBAL and the default limit', async () => {
      prisma.leaderboardEntry.findMany.mockResolvedValue([]);

      await service.getTop10();

      expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdAt: undefined, source: 'QUIZ' },
          take: LEADERBOARD_DEFAULT_LIMIT,
        }),
      );
    });
  });

  // ── upsertEntry ──────────────────────────────────────────────────────────────

  describe('upsertEntry', () => {
    it('returns undefined when attempt does not exist', async () => {
      prisma.quizAttempt.findUnique.mockResolvedValue(null);

      const result = await service.upsertEntry('bad-attempt-id', 'participant-id', 'participant-id');

      expect(result).toBeUndefined();
      expect(prisma.leaderboardEntry.upsert).not.toHaveBeenCalled();
    });

    it('upserts a leaderboard entry with the attempt score', async () => {
      const participant = makeParticipant();
      const attempt = makeAttemptWithSession(participant);
      const entry = makeLeaderboardEntry({ attemptId: attempt.id });

      prisma.quizAttempt.findUnique.mockResolvedValue(attempt);
      prisma.leaderboardEntry.upsert.mockResolvedValue(entry);
      prisma.leaderboardEntry.findMany.mockResolvedValue([entry]);
      prisma.leaderboardEntry.update.mockResolvedValue(entry);

      await service.upsertEntry(attempt.id, participant.id, participant.id);

      expect(prisma.leaderboardEntry.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { attemptId: attempt.id },
          create: expect.objectContaining({
            score: attempt.score,
            percentage: attempt.percentage,
            participantId: participant.id,
            designationId: participant.designationId,
            type: 'GLOBAL',
          }),
        }),
      );
    });

    it('triggers rank recalculation after upsert', async () => {
      const participant = makeParticipant();
      const attempt = makeAttemptWithSession(participant);
      const entry = makeLeaderboardEntry();

      prisma.quizAttempt.findUnique.mockResolvedValue(attempt);
      prisma.leaderboardEntry.upsert.mockResolvedValue(entry);
      prisma.leaderboardEntry.findMany.mockResolvedValue([entry]);
      prisma.leaderboardEntry.update.mockResolvedValue(entry);

      await service.upsertEntry(attempt.id, participant.id, participant.id);

      expect(prisma.leaderboardEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: 'GLOBAL', source: 'QUIZ' } }),
      );
    });

    it('assigns ranks in order: highest score gets rank 1', async () => {
      const participant = makeParticipant();
      const attempt = makeAttemptWithSession(participant);
      const entryA = makeLeaderboardEntry({ score: 90 });
      const entryB = makeLeaderboardEntry({ score: 60 });
      const entryC = makeLeaderboardEntry({ score: 30 });

      prisma.quizAttempt.findUnique.mockResolvedValue(attempt);
      prisma.leaderboardEntry.upsert.mockResolvedValue(entryA);
      // findMany returns entries already ordered (as the DB would do it)
      prisma.leaderboardEntry.findMany.mockResolvedValue([entryA, entryB, entryC]);
      prisma.leaderboardEntry.update.mockResolvedValue(entryA);

      await service.upsertEntry(attempt.id, participant.id, participant.id);

      const updateCalls = prisma.leaderboardEntry.update.mock.calls;
      expect(updateCalls[0][0]).toMatchObject({ where: { id: entryA.id }, data: { rank: 1 } });
      expect(updateCalls[1][0]).toMatchObject({ where: { id: entryB.id }, data: { rank: 2 } });
      expect(updateCalls[2][0]).toMatchObject({ where: { id: entryC.id }, data: { rank: 3 } });
    });
  });
});
