import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './helpers/app.helper';
import { truncateAll, disconnectDb } from './helpers/db.helper';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  afterAll(async () => {
    await app.close();
    await disconnectDb();
  });

  it('GET /api/health → 200 with database up', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.info.database.status).toBe('up');
  });
});
