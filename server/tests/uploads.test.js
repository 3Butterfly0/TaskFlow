import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// Mock cloudinary to avoid external calls
vi.mock('../src/config/cloudinary.js', () => ({
  default: {
    uploader: {
      upload_stream: (options, callback) => {
        const stream = {
          write: vi.fn(),
          end: vi.fn(() => callback(null, { secure_url: 'http://test-url.com', public_id: 'test-id' }))
        };
        return stream;
      }
    }
  }
}));

describe('Upload Endpoints', () => {
  let token;
  const userData = {
    username: 'uploaduser',
    email: 'upload@example.com',
    password: 'Password123'
  };

  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(userData);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password });
    token = loginRes.body.data.accessToken;
  });

  it('should upload a file', async () => {
    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('test content'), 'test.txt');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('url');
  });
});
