import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Ticket Endpoints', () => {
  let token;
  let projectId;
  const userData = {
    username: 'ticketuser',
    email: 'ticket@example.com',
    password: 'Password123'
  };

  beforeEach(async () => {
    // Auth
    await request(app).post('/api/auth/register').send(userData);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password });
    token = loginRes.body.data.accessToken;

    // Project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ticket Project' });
    projectId = projRes.body.data._id;
  });

  it('should create a ticket', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${token}`)
      .query({ projectId })
      .send({
        title: 'Bug report',
        description: 'Something is broken',
        priority: 'high'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('title', 'Bug report');
  });
});
