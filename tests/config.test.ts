import { afterEach, describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { createUnconfiguredChatService } from '../src/services/openai.js';
import request from 'supertest';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('OPENAI_API_KEY configuration', () => {
  it('fails clearly when OPENAI_API_KEY is missing', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'test',
        PORT: '3000',
      }),
    ).toThrow(ConfigError);

    expect(() =>
      loadConfig({
        NODE_ENV: 'test',
        PORT: '3000',
      }),
    ).toThrow(/OPENAI_API_KEY is missing/);
  });

  it('loads a valid configuration from the environment', () => {
    const config = loadConfig({
      OPENAI_API_KEY: 'sk-test-key',
      PORT: '8080',
      HOST: '0.0.0.0',
      NODE_ENV: 'test',
    });

    expect(config.openaiApiKey).toBe('sk-test-key');
    expect(config.port).toBe(8080);
    expect(config.host).toBe('0.0.0.0');
  });

  it('returns 500 MISSING_API_CONFIGURATION when the service is unconfigured', async () => {
    const app = createApp({ chatService: createUnconfiguredChatService() });

    const response = await request(app).post('/v1/chat').send({ message: 'Explain DNS' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'MISSING_API_CONFIGURATION',
        message: 'The service is not configured. Set OPENAI_API_KEY and restart the server.',
      },
    });
    expect(JSON.stringify(response.body)).not.toMatch(/sk-/);
  });
});
