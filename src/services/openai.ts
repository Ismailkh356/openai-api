import OpenAI from 'openai';
import type { AppConfig } from '../config/env.js';
import {
  DEFAULT_MAX_OUTPUT_TOKENS,
  MODEL_ID,
  OPENAI_MAX_RETRIES,
  OPENAI_TIMEOUT_MS,
  type ReasoningEffort,
} from '../config/constants.js';
import { AppError } from '../middleware/error-handler.js';
import { mapProviderError } from './errors.js';

export type ChatInput = {
  message: string;
  system?: string;
  reasoningEffort: ReasoningEffort;
};

export type ChatResult = {
  model: typeof MODEL_ID;
  response: string;
};

export interface ChatService {
  createChat(input: ChatInput): Promise<ChatResult>;
}

export class OpenAIChatService implements ChatService {
  constructor(
    private readonly client: OpenAI,
    private readonly maxOutputTokens: number = DEFAULT_MAX_OUTPUT_TOKENS,
  ) {}

  async createChat(input: ChatInput): Promise<ChatResult> {
    try {
      const response = await this.client.responses.create({
        model: MODEL_ID,
        input: input.message,
        ...(input.system ? { instructions: input.system } : {}),
        reasoning: { effort: input.reasoningEffort },
        max_output_tokens: this.maxOutputTokens,
      });

      const text = response.output_text?.trim() ?? '';
      if (!text) {
        throw new AppError(502, 'OPENAI_API_ERROR', 'The model returned an empty response.');
      }

      return {
        model: MODEL_ID,
        response: text,
      };
    } catch (error) {
      throw mapProviderError(error);
    }
  }
}

export function createOpenAIChatService(config: AppConfig): ChatService {
  const client = new OpenAI({
    apiKey: config.openaiApiKey,
    timeout: OPENAI_TIMEOUT_MS,
    maxRetries: OPENAI_MAX_RETRIES,
  });

  return new OpenAIChatService(client, config.maxOutputTokens);
}

export function createUnconfiguredChatService(): ChatService {
  return {
    async createChat(): Promise<ChatResult> {
      throw new AppError(
        500,
        'MISSING_API_CONFIGURATION',
        'The service is not configured. Set OPENAI_API_KEY and restart the server.',
      );
    },
  };
}
