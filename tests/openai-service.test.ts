import type OpenAI from 'openai';
import { describe, expect, it, vi } from 'vitest';
import { OpenAIChatService } from '../src/services/openai.js';

describe('OpenAIChatService', () => {
  it('calls the Responses API with gpt-6-astra and reasoning effort', async () => {
    const create = vi.fn().mockResolvedValue({ output_text: '  DNS is a directory.  ' });
    const client = { responses: { create } } as unknown as OpenAI;
    const service = new OpenAIChatService(client, 2048);

    const result = await service.createChat({
      message: 'Explain DNS',
      system: 'You are a helpful technical assistant',
      reasoningEffort: 'high',
    });

    expect(create).toHaveBeenCalledWith({
      model: 'gpt-6-astra',
      input: 'Explain DNS',
      instructions: 'You are a helpful technical assistant',
      reasoning: { effort: 'high' },
      max_output_tokens: 2048,
    });
    expect(result).toEqual({
      model: 'gpt-6-astra',
      response: 'DNS is a directory.',
    });
  });

  it('omits instructions when no system prompt is provided', async () => {
    const create = vi.fn().mockResolvedValue({ output_text: 'ok' });
    const client = { responses: { create } } as unknown as OpenAI;
    const service = new OpenAIChatService(client);

    await service.createChat({
      message: 'Hello',
      reasoningEffort: 'low',
    });

    expect(create).toHaveBeenCalledWith({
      model: 'gpt-6-astra',
      input: 'Hello',
      reasoning: { effort: 'low' },
      max_output_tokens: 4096,
    });
  });
});
