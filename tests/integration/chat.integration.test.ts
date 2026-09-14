import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { loadConfig } from '../../src/config/env.js';
import { createOpenAIChatService } from '../../src/services/openai.js';

const enabled = Boolean(process.env.OPENAI_API_KEY) && process.env.RUN_OPENAI_INTEGRATION === '1';

describe.skipIf(!enabled)('OpenAI integration', () => {
  it('returns a GPT-6 Astra completion from the real Responses API', async () => {
    const config = loadConfig();
    const app = createApp({ chatService: createOpenAIChatService(config) });

    const response = await request(app)
      .post('/v1/chat')
      .send({
        message: 'Reply with the single word pong.',
        reasoning_effort: 'low',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.model).toBe('gpt-6-astra');
    expect(typeof response.body.response).toBe('string');
    expect(response.body.response.length).toBeGreaterThan(0);
  }, 120_000);
});
