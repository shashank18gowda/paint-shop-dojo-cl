import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/app.helper';
import { truncateAll, seedBaseData, disconnectDb } from './helpers/db.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await truncateAll();
    await seedBaseData();
  });

  afterAll(async () => {
    await app.close();
    await disconnectDb();
  });

  // ── POST /api/auth/login ─────────────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('returns token and participant profile for valid code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ employeeCode: 'EMP001' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.participant).toMatchObject({
        code: 'EMP001',
        name: 'Test User',
      });
    });

    it('returns 404 for unknown employee code', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ employeeCode: 'NOTFOUND' })
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('returns 400 when employeeCode is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('returns 400 when employeeCode is too short', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ employeeCode: 'AB' })
        .expect(400);
    });
  });

  // ── GET /api/auth/me ─────────────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('returns participant profile with valid JWT', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ employeeCode: 'EMP001' });

      const token = loginRes.body.data.token;

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ code: 'EMP001', name: 'Test User' });
    });

    it('returns 401 without Authorization header', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('returns 401 with malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });
  });
});
