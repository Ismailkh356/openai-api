import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { MODEL_ID } from '../src/config/constants.js';
import type { ChatService } from '../src/services/openai.js';

function mockService(overrides?: Partial<ChatService>): ChatService {
  return {
    createChat: vi.fn().mockResolvedValue({
      model: MODEL_ID,
      response: 'DNS maps names to addresses.',
    }),
    ...overrides,
  };
}

describe('POST /v1/chat', () => {
  it('returns a clean completion for valid input', async () => {
    const chatService = mockService();
    const app = createApp({ chatService });

    const response = await request(app)
      .post('/v1/chat')
      .send({
        message: 'Explain how DNS works',
        system: 'You are a helpful technical assistant',
        reasoning_effort: 'low',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      model: 'gpt-6-astra',
      response: 'DNS maps names to addresses.',
    });
    expect(chatService.createChat).toHaveBeenCalledWith({
      message: 'Explain how DNS works',
      system: 'You are a helpful technical assistant',
      reasoningEffort: 'low',
    });
  });

  it('defaults reasoning effort when it is omitted', async () => {
    const chatService = mockService();
    const app = createApp({ chatService });

    const response = await request(app).post('/v1/chat').send({ message: 'Explain DNS in simple terms' });

    expect(response.status).toBe(200);
    expect(chatService.createChat).toHaveBeenCalledWith({
      message: 'Explain DNS in simple terms',
      system: undefined,
      reasoningEffort: 'low',
    });
  });

  it('rejects a missing message with 400', async () => {
    const chatService = mockService();
    const app = createApp({ chatService });

    const response = await request(app).post('/v1/chat').send({ reasoning_effort: 'low' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBe('message is required');
    expect(chatService.createChat).not.toHaveBeenCalled();
  });

  it('rejects an invalid reasoning_effort with 400', async () => {
    const chatService = mockService();
    const app = createApp({ chatService });

    const response = await request(app)
      .post('/v1/chat')
      .send({ message: 'Explain DNS', reasoning_effort: 'extreme' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('reasoning_effort');
    expect(chatService.createChat).not.toHaveBeenCalled();
  });
});
