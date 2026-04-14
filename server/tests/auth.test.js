import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// Mock email to avoid errors in registration
vi.mock('../src/utils/email.js', () => ({
  sendEmail: vi.fn().mockResolvedValue(true)
}));

describe('Auth Endpoints', () => {
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123'
  };

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('should login an existing user', async () => {
    const loginData = {
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'Password123'
    };
    // Register first
    await request(app).post('/api/auth/register').send(loginData);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: loginData.email,
        password: loginData.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.header['set-cookie']).toBeDefined();
    expect(res.body.data).toBeDefined();
  });

  it('should not login with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: 'WrongPassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
