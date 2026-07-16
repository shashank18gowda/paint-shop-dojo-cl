import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/app.helper';
import { truncateAll, seedBaseData, disconnectDb } from './helpers/db.helper';

describe('Reference Data (e2e)', () => {
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

  describe('GET /api/languages', () => {
    it('returns seeded languages with success wrapper', async () => {
      const res = await request(app.getHttpServer()).get('/api/languages').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toMatchObject({ code: 'EN', name: 'English' });
    });
  });

  describe('GET /api/lines', () => {
    it('returns only active lines', async () => {
      const res = await request(app.getHttpServer()).get('/api/lines').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toMatchObject({ code: 'LINE-A', name: 'Assembly Line A' });
    });
  });

  describe('GET /api/participant-types', () => {
    it('returns active participant types', async () => {
      const res = await request(app.getHttpServer()).get('/api/participant-types').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toMatchObject({ code: 'OPERATOR', name: 'Operator' });
    });
  });
});
