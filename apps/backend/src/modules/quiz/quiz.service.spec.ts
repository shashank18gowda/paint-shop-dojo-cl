import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import { QuizService } from './quiz.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { createPrismaMock, PrismaMock } from '../../test/prisma.mock';

// ── Factories ─────────────────────────────────────────────────────────────────

const makeSession = (overrides = {}) => ({
  id: faker.string.uuid(),
  participantId: faker.string.uuid(),
  kind: 'QUIZ' as const,
  lineId: null,
  languageCode: null,
  status: 'IN_PROGRESS' as const,
  startedAt: new Date(Date.now() - 60_000), // started 1 minute ago
  completedAt: null,
  durationSeconds: null,
  score: null,
  maxScore: null,
  isPassed: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeQuestion = (points = 10, overrides = {}) => ({
  id: faker.string.uuid(),
  isActive: true,
  type: 'SINGLE_CHOICE' as const,
  points,
  timeLimit: 30,
  difficulty: 1,
  shuffleOptions: false,
  explanation: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  options: [
    { id: faker.string.uuid(), questionId: '', isCorrect: true,  order: 1 },
    { id: faker.string.uuid(), questionId: '', isCorrect: false, order: 2 },
  ],
  ...overrides,
});

const makePerformanceLevel = (overrides = {}) => ({
  id: faker.string.uuid(),
  code: 'GOOD',
  name: 'Good',
  minScore: 50,
  maxScore: 75,
  color: '#00aa00',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeAttempt = (overrides = {}) => ({
  id: faker.string.uuid(),
  sessionId: faker.string.uuid(),
  totalQuestions: 1,
  correctAnswers: 1,
  score: 10,
  maxScore: 10,
  percentage: 100,
  isPassed: true,
  performanceLevelId: null,
  performanceLevel: null,
  startedAt: new Date(),
  completedAt: new Date(),
  createdAt: new Date(),
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('QuizService', () => {
  let service: QuizService;
  let prisma: PrismaMock;
  let leaderboard: jest.Mocked<LeaderboardService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    leaderboard = { upsertEntry: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<LeaderboardService>;
    configService = { get: jest.fn().mockImplementation((_key: string, def: unknown) => def) } as unknown as jest.Mocked<ConfigService>;

    // Default: $transaction executes the callback with prisma as tx
    prisma.$transaction.mockImplementation(async (fn: unknown) => {
      if (typeof fn === 'function') return fn(prisma);
      return Promise.all(fn as Promise<unknown>[]);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        { provide: PrismaService, useValue: prisma },
        { provide: LeaderboardService, useValue: leaderboard },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(QuizService);
  });

  // ── submitAnswers ────────────────────────────────────────────────────────────

  describe('submitAnswers', () => {
    it('calculates score correctly when all answers are correct', async () => {
      const q1 = makeQuestion(10);
      const q2 = makeQuestion(20);
      const session = makeSession();
      const attempt = makeAttempt({ score: 30, maxScore: 30, percentage: 100 });

      prisma.participantSession.findFirst.mockResolvedValue(session);
      prisma.question.findMany.mockResolvedValue([q1, q2]);
      prisma.performanceLevel.findFirst.mockResolvedValue(null);
      prisma.quizAttempt.create.mockResolvedValue(attempt);
      prisma.participantSession.update.mockResolvedValue({ ...session, status: 'COMPLETED' });

      const dto = {
        answers: [
          { questionId: q1.id, optionId: q1.options[0].id, timeTaken: 5 },
          { questionId: q2.id, optionId: q2.options[0].id, timeTaken: 8 },
        ],
      };

      const result = await service.submitAnswers(session.id, session.participantId, dto);

      expect(result.score).toBe(30);
      expect(result.maxScore).toBe(30);
      expect(result.percentage).toBe(100);
      expect(result.correctAnswers).toBe(2);
    });

    it('calculates score correctly when all answers are wrong', async () => {
      const q1 = makeQuestion(10);
      const session = makeSession();
      const attempt = makeAttempt({ score: 0, maxScore: 10, percentage: 0 });

      prisma.participantSession.findFirst.mockResolvedValue(session);
      prisma.question.findMany.mockResolvedValue([q1]);
      prisma.performanceLevel.findFirst.mockResolvedValue(null);
      prisma.quizAttempt.create.mockResolvedValue(attempt);
      prisma.participantSession.update.mockResolvedValue({ ...session, status: 'COMPLETED' });

      const dto = {
        answers: [{ questionId: q1.id, optionId: q1.options[1].id, timeTaken: 5 }], // wrong option
      };

      const result = await service.submitAnswers(session.id, session.participantId, dto);

      expect(result.score).toBe(0);
      expect(result.correctAnswers).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('calculates percentage correctly for partial score', async () => {
      const q1 = makeQuestion(10);
      const q2 = makeQuestion(10);
      const session = makeSession();
      const attempt = makeAttempt({ score: 10, maxScore: 20, percentage: 50 });

      prisma.participantSession.findFirst.mockResolvedValue(session);
      prisma.question.findMany.mockResolvedValue([q1, q2]);
      prisma.performanceLevel.findFirst.mockResolvedValue(null);
      prisma.quizAttempt.create.mockResolvedValue(attempt);
      prisma.participantSession.update.mockResolvedValue({ ...session, status: 'COMPLETED' });

      const dto = {
        answers: [
          { questionId: q1.id, optionId: q1.options[0].id, timeTaken: 5 }, // correct
          { questionId: q2.id, optionId: q2.options[1].id, timeTaken: 5 }, // wrong
        ],
      };

      const result = await service.submitAnswers(session.id, session.participantId, dto);

      expect(result.score).toBe(10);
      expect(result.maxScore).toBe(20);
      expect(result.correctAnswers).toBe(1);
    });

    it('marks attempt as passed when percentage meets threshold', async () => {
      const q1 = makeQuestion(10);
      const session = makeSession();
      const attempt = makeAttempt();

      prisma.participantSession.findFirst.mockResolvedValue(session);
      prisma.question.findMany.mockResolvedValue([q1]);
      prisma.performanceLevel.findFirst.mockResolvedValue(null);
      prisma.quizAttempt.create.mockResolvedValue(attempt);
      prisma.participantSession.update.mockResolvedValue({ ...session, status: 'COMPLETED' });

      const dto = {
        answers: [{ questionId: q1.id, optionId: q1.options[0].id, timeTaken: 5 }], // correct → 100%
      };

      await service.submitAnswers(session.id, session.participantId, dto);

      expect(prisma.quizAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isPassed: true }) }),
      );
      expect(prisma.participantSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isPassed: true }) }),
      );
    });

    it('marks attempt as failed when percentage is below threshold', async () => {
      const q1 = makeQuestion(10);
      const session = makeSession();
      const attempt = makeAttempt({ score: 0, maxScore: 10, percentage: 0 });

      prisma.participantSession.findFirst.mockResolvedValue(session);
      prisma.question.findMany.mockResolvedValue([q1]);
      prisma.performanceLevel.findFirst.mockResolvedValue(null);
      prisma.quizAttempt.create.mockResolvedValue(attempt);
      prisma.participantSession.update.mockResolvedValue({ ...session, status: 'COMPLETED' });

      const dto = {
        answers: [{ questionId: q1.id, optionId: q1.options[1].id, timeTaken: 5 }], // wrong → 0%
      };

      await service.submitAnswers(session.id, session.participantId, dto);

      expect(prisma.quizAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isPassed: false }) }),
      );
      expect(prisma.participantSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ isPassed: false }) }),
      );
    });

    it('skips answers for unknown question IDs silently', async () => {
      const q1 = makeQuestion(10);
      const session = makeSession();
      const attempt = makeAttempt({ score: 10, maxScore: 10, percentage: 100 });

      prisma.participantSession.findFirst.mockResolvedValue(session);
      prisma.question.findMany.mockResolvedValue([q1]);
      prisma.performanceLevel.findFirst.mockResolvedValue(null);
      prisma.quizAttempt.create.mockResolvedValue(attempt);
      prisma.participantSession.update.mockResolvedValue({ ...session, status: 'COMPLETED' });

      const dto = {
        answers: [
          { questionId: q1.id, optionId: q1.options[0].id, timeTaken: 5 },   // valid
          { questionId: 'non-existent-id', optionId: faker.string.uuid(), timeTaken: 5 }, // unknown — skipped
        ],
      };

      const result = await service.submitAnswers(session.id, session.participantId, dto);

      expect(result.score).toBe(10);
      expect(result.maxScore).toBe(10);
    });

    it('includes performance level in result when one matches', async () => {
      const q1 = makeQuestion(10);
      const session = makeSession();
      const level = makePerformanceLevel({ minScore: 90, maxScore: 100 });
      const attempt = makeAttempt({ performanceLevel: level });

      prisma.participantSession.findFirst.mockResolvedValue(session);
      prisma.question.findMany.mockResolvedValue([q1]);
      prisma.performanceLevel.findFirst.mockResolvedValue(level);
      prisma.quizAttempt.create.mockResolvedValue(attempt);
      prisma.participantSession.update.mockResolvedValue({ ...session, status: 'COMPLETED' });

      const dto = {
        answers: [{ questionId: q1.id, optionId: q1.options[0].id, timeTaken: 5 }],
      };

      const result = await service.submitAnswers(session.id, session.participantId, dto);

      expect(result.performance).not.toBeNull();
      expect(result.performance?.name).toBe(level.name);
      expect(result.performance?.color).toBe(level.color);
    });

    it('returns null performance when no level matches', async () => {
      const q1 = makeQuestion(10);
      const session = makeSession();
      const attempt = makeAttempt({ performanceLevel: null });

      prisma.participantSession.findFirst.mockResolvedValue(session);
      prisma.question.findMany.mockResolvedValue([q1]);
      prisma.performanceLevel.findFirst.mockResolvedValue(null);
      prisma.quizAttempt.create.mockResolvedValue(attempt);
      prisma.participantSession.update.mockResolvedValue({ ...session, status: 'COMPLETED' });

      const dto = {
        answers: [{ questionId: q1.id, optionId: q1.options[0].id, timeTaken: 5 }],
      };

      const result = await service.submitAnswers(session.id, session.participantId, dto);

      expect(result.performance).toBeNull();
    });

    it('calls leaderboard.upsertEntry after successful submission', async () => {
      const q1 = makeQuestion(10);
      const session = makeSession();
      const attempt = makeAttempt();

      prisma.participantSession.findFirst.mockResolvedValue(session);
      prisma.question.findMany.mockResolvedValue([q1]);
      prisma.performanceLevel.findFirst.mockResolvedValue(null);
      prisma.quizAttempt.create.mockResolvedValue(attempt);
      prisma.participantSession.update.mockResolvedValue({ ...session, status: 'COMPLETED' });

      const dto = {
        answers: [{ questionId: q1.id, optionId: q1.options[0].id, timeTaken: 5 }],
      };

      await service.submitAnswers(session.id, session.participantId, dto);

      expect(leaderboard.upsertEntry).toHaveBeenCalledWith(
        attempt.id,
        session.participantId,
        session.participantId,
      );
    });

    it('throws NotFoundException when session does not exist', async () => {
      prisma.participantSession.findFirst.mockResolvedValue(null);

      await expect(
        service.submitAnswers('bad-id', 'participant-id', { answers: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when session is already completed', async () => {
      prisma.participantSession.findFirst.mockResolvedValue(
        makeSession({ status: 'COMPLETED' }),
      );

      await expect(
        service.submitAnswers('session-id', 'participant-id', { answers: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException with correct message for completed session', async () => {
      prisma.participantSession.findFirst.mockResolvedValue(
        makeSession({ status: 'COMPLETED' }),
      );

      await expect(
        service.submitAnswers('session-id', 'participant-id', { answers: [] }),
      ).rejects.toThrow('Session is already completed');
    });
  });

  // ── getSessionResult ─────────────────────────────────────────────────────────

  describe('getSessionResult', () => {
    it('returns session when it belongs to the participant', async () => {
      const session = makeSession();
      prisma.participantSession.findFirst.mockResolvedValue(session);

      const result = await service.getSessionResult(session.id, session.participantId);

      expect(result).toEqual(session);
      expect(prisma.participantSession.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: session.id, participantId: session.participantId },
        }),
      );
    });

    it('throws NotFoundException for a session belonging to another participant', async () => {
      prisma.participantSession.findFirst.mockResolvedValue(null);

      await expect(
        service.getSessionResult('session-id', 'other-participant-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
