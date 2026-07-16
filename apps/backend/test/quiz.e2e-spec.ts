import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/app.helper';
import { truncateAll, seedBaseData, disconnectDb } from './helpers/db.helper';

describe('Quiz (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let correctAnswerMap: Map<string, string>; // questionId → correct optionId

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await truncateAll();
    const { questions, userParticipant: _ } = await seedBaseData();

    // Build map: questionId → correct optionId (from seed data)
    correctAnswerMap = new Map(
      questions.map((q) => [q.id, q.options.find((o) => o.isCorrect)!.id]),
    );

    // Get auth token for the test user
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ employeeCode: 'EMP001' });
    token = loginRes.body.data.token;
  });

  afterAll(async () => {
    await app.close();
    await disconnectDb();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  // ── GET /api/quiz/questions ──────────────────────────────────────────────────

  describe('GET /api/quiz/questions', () => {
    it('returns questions with text and options (no isCorrect exposed)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/quiz/questions?lang=EN&count=5')
        .set(auth())
        .expect(200);

      expect(res.body.success).toBe(true);
      const questions = res.body.data;
      expect(questions.length).toBe(5);
      expect(questions[0]).toMatchObject({
        id: expect.any(String),
        type: 'SINGLE_CHOICE',
        points: 10,
        text: expect.any(String),
      });
      // isCorrect must NOT be exposed
      expect(questions[0].options[0].isCorrect).toBeUndefined();
    });

    it('returns 401 without auth token', async () => {
      await request(app.getHttpServer()).get('/api/quiz/questions').expect(401);
    });

    it('returns 404 for unsupported language', async () => {
      await request(app.getHttpServer())
        .get('/api/quiz/questions?lang=XX')
        .set(auth())
        .expect(404);
    });
  });

  // ── POST /api/quiz/sessions ──────────────────────────────────────────────────

  describe('POST /api/quiz/sessions', () => {
    it('creates a session and returns sessionId + questions', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/quiz/sessions')
        .set(auth())
        .send({ language: 'EN', questionCount: 5 })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionId).toBeDefined();
      expect(Array.isArray(res.body.data.questions)).toBe(true);
      expect(res.body.data.questions.length).toBe(5);
    });

    it('returns 401 without auth token', async () => {
      await request(app.getHttpServer())
        .post('/api/quiz/sessions')
        .send({ language: 'EN' })
        .expect(401);
    });
  });

  // ── POST /api/quiz/sessions/:id/submit ───────────────────────────────────────

  describe('POST /api/quiz/sessions/:id/submit', () => {
    it('calculates score correctly when all answers are correct', async () => {
      // Start session
      const sessionRes = await request(app.getHttpServer())
        .post('/api/quiz/sessions')
        .set(auth())
        .send({ language: 'EN', questionCount: 5 });

      const { sessionId, questions } = sessionRes.body.data;

      // Build answers using correct option IDs from seed data
      const answers = questions.map((q: { id: string }) => ({
        questionId: q.id,
        optionId: correctAnswerMap.get(q.id)!,
        timeTaken: 5,
      }));

      const res = await request(app.getHttpServer())
        .post(`/api/quiz/sessions/${sessionId}/submit`)
        .set(auth())
        .send({ answers })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(50);       // 5 questions × 10 points
      expect(res.body.data.maxScore).toBe(50);
      expect(res.body.data.percentage).toBe(100);
      expect(res.body.data.correctAnswers).toBe(5);
    });

    it('returns 0 score when all answers are wrong', async () => {
      const sessionRes = await request(app.getHttpServer())
        .post('/api/quiz/sessions')
        .set(auth())
        .send({ language: 'EN', questionCount: 5 });

      const { sessionId, questions } = sessionRes.body.data;

      // Use the wrong option (the one that is NOT the correct answer)
      const answers = questions.map((q: { id: string; options: { id: string }[] }) => ({
        questionId: q.id,
        optionId: q.options.find((o: { id: string }) => o.id !== correctAnswerMap.get(q.id))!.id,
        timeTaken: 5,
      }));

      const res = await request(app.getHttpServer())
        .post(`/api/quiz/sessions/${sessionId}/submit`)
        .set(auth())
        .send({ answers })
        .expect(201);

      expect(res.body.data.score).toBe(0);
      expect(res.body.data.correctAnswers).toBe(0);
      expect(res.body.data.percentage).toBe(0);
    });

    it('returns 400 when session is already completed', async () => {
      const sessionRes = await request(app.getHttpServer())
        .post('/api/quiz/sessions')
        .set(auth())
        .send({ language: 'EN', questionCount: 5 });

      const { sessionId, questions } = sessionRes.body.data;
      const answers = questions.map((q: { id: string }) => ({
        questionId: q.id,
        optionId: correctAnswerMap.get(q.id)!,
        timeTaken: 5,
      }));

      // First submission
      await request(app.getHttpServer())
        .post(`/api/quiz/sessions/${sessionId}/submit`)
        .set(auth())
        .send({ answers });

      // Second submission on same session
      const res = await request(app.getHttpServer())
        .post(`/api/quiz/sessions/${sessionId}/submit`)
        .set(auth())
        .send({ answers })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('returns 404 for a session that does not belong to the participant', async () => {
      // Start session as EMP001
      const sessionRes = await request(app.getHttpServer())
        .post('/api/quiz/sessions')
        .set(auth())
        .send({ language: 'EN', questionCount: 5 });
      const { sessionId } = sessionRes.body.data;

      // Log in as ADMIN001 and try to submit to EMP001's session
      const adminLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ employeeCode: 'ADMIN001' });
      const adminToken = adminLogin.body.data.token;

      await request(app.getHttpServer())
        .post(`/api/quiz/sessions/${sessionId}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ answers: [] })
        .expect(404);
    });
  });

  // ── GET /api/quiz/sessions/:id ───────────────────────────────────────────────

  describe('GET /api/quiz/sessions/:id', () => {
    it('returns completed session result after submission', async () => {
      const sessionRes = await request(app.getHttpServer())
        .post('/api/quiz/sessions')
        .set(auth())
        .send({ language: 'EN', questionCount: 5 });

      const { sessionId, questions } = sessionRes.body.data;
      const answers = questions.map((q: { id: string }) => ({
        questionId: q.id,
        optionId: correctAnswerMap.get(q.id)!,
        timeTaken: 5,
      }));

      await request(app.getHttpServer())
        .post(`/api/quiz/sessions/${sessionId}/submit`)
        .set(auth())
        .send({ answers });

      const res = await request(app.getHttpServer())
        .get(`/api/quiz/sessions/${sessionId}`)
        .set(auth())
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.isPassed).toBe(true);
    });

    it('returns 404 for session belonging to another participant', async () => {
      const sessionRes = await request(app.getHttpServer())
        .post('/api/quiz/sessions')
        .set(auth())
        .send({ language: 'EN', questionCount: 5 });
      const { sessionId } = sessionRes.body.data;

      const adminLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ employeeCode: 'ADMIN001' });

      await request(app.getHttpServer())
        .get(`/api/quiz/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${adminLogin.body.data.token}`)
        .expect(404);
    });
  });
});
