import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

describe('GET /health', () => {
  it('returns status ok without calling OpenAI', async () => {
    const createChat = vi.fn();
    const app = createApp({ chatService: { createChat } });

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
    expect(createChat).not.toHaveBeenCalled();
  });
});
