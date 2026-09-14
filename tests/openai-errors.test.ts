import { APIError, APIConnectionError } from 'openai/core/error';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { AppError } from '../src/middleware/error-handler.js';
import { mapProviderError } from '../src/services/errors.js';
import { OpenAIChatService } from '../src/services/openai.js';
import type OpenAI from 'openai';

function providerError(status: number): APIError {
  return APIError.generate(status, { error: { message: 'secret upstream detail' } }, undefined, new Headers());
}

function serviceRejecting(error: unknown): OpenAIChatService {
  const create = vi.fn().mockRejectedValue(error);
  const client = { responses: { create } } as unknown as OpenAI;
  return new OpenAIChatService(client);
}

describe('OpenAI error handling', () => {
  it('maps rate limits to 429 without leaking upstream details', async () => {
    const app = createApp({ chatService: serviceRejecting(providerError(429)) });

    const response = await request(app).post('/v1/chat').send({ message: 'Explain DNS' });

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'OPENAI_RATE_LIMIT',
        message: 'The model is currently rate limited. Please retry shortly.',
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('secret upstream detail');
  });

  it('maps authentication failures to 500', async () => {
    const app = createApp({ chatService: serviceRejecting(providerError(401)) });

    const response = await request(app).post('/v1/chat').send({ message: 'Explain DNS' });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('OPENAI_AUTHENTICATION_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('secret upstream detail');
  });

  it('maps upstream 5xx failures to 502', async () => {
    const app = createApp({ chatService: serviceRejecting(providerError(503)) });

    const response = await request(app).post('/v1/chat').send({ message: 'Explain DNS' });

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe('OPENAI_API_ERROR');
  });

  it('maps connection failures to 502', () => {
    const mapped = mapProviderError(new APIConnectionError({ message: 'dns failed' }));
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped.statusCode).toBe(502);
    expect(mapped.code).toBe('OPENAI_API_ERROR');
    expect(mapped.message).not.toContain('dns failed');
  });

  it('does not expose stack traces or unexpected error text', async () => {
    const app = createApp({
      chatService: {
        createChat: vi.fn().mockRejectedValue(new Error('Invalid API key sk-secret-should-not-leak')),
      },
    });

    const response = await request(app).post('/v1/chat').send({ message: 'Explain DNS' });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(response.body)).not.toContain('sk-secret');
    expect(JSON.stringify(response.body)).not.toContain('stack');
  });
});
