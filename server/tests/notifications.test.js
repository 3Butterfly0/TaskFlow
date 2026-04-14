import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Notification Endpoints', () => {
  let token;
  const userData = {
    username: 'notifuser',
    email: 'notif@example.com',
    password: 'Password123'
  };

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(userData);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password });
    token = loginRes.header['set-cookie'];
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should get notifications for user', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Cookie', token);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('notifications');
    expect(Array.isArray(res.body.data.notifications)).toBe(true);
    expect(res.body.data).toHaveProperty('unreadCount');
    expect(typeof res.body.data.unreadCount).toBe('number');
    expect(res.body.data).toHaveProperty('pagination');
  });
});
