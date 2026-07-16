import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/app.helper';
import { truncateAll, seedBaseData, disconnectDb } from './helpers/db.helper';

describe('Leaderboard (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let correctAnswerMap: Map<string, string>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await truncateAll();
    const { questions } = await seedBaseData();

    correctAnswerMap = new Map(
      questions.map((q) => [q.id, q.options.find((o) => o.isCorrect)!.id]),
    );

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

  // ── GET /api/leaderboard ─────────────────────────────────────────────────────

  describe('GET /api/leaderboard', () => {
    it('returns empty leaderboard when no attempts have been made', async () => {
      const res = await request(app.getHttpServer()).get('/api/leaderboard').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('is public — no auth required', async () => {
      await request(app.getHttpServer()).get('/api/leaderboard').expect(200);
    });

    it('accepts type and limit query params', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/leaderboard?type=GLOBAL&limit=5')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('shows entry after a completed quiz attempt', async () => {
      // Complete a quiz session
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

      // Leaderboard should now have the entry
      const res = await request(app.getHttpServer()).get('/api/leaderboard').expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]).toMatchObject({
        score: 50,
        rank: 1,
      });
      expect(res.body.data[0].participant.name).toBe('Test User');
    });
  });
});
