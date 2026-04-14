import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Project Endpoints', () => {
  let token;
  const userData = {
    username: 'projectuser',
    email: 'project@example.com',
    password: 'Password123'
  };

  beforeEach(async () => {
    // Register and login to get token
    await request(app).post('/api/auth/register').send(userData);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password });
    token = loginRes.header['set-cookie'];
  });

  it('should create a new project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Cookie', token)
      .send({
        name: 'Test Project',
        description: 'Test Description'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('name', 'Test Project');
  });

  it('should get all projects for user', async () => {
    await request(app)
      .post('/api/projects')
      .set('Cookie', token)
      .send({ name: 'Project 1' });

    const res = await request(app)
      .get('/api/projects')
      .set('Cookie', token);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
