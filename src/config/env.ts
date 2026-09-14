import { z } from 'zod';
import {
  DEFAULT_HOST,
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_PORT,
} from './constants.js';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

const envSchema = z.object({
  OPENAI_API_KEY: z.string().trim().min(1, 'OPENAI_API_KEY is required'),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  HOST: z.string().trim().min(1).default(DEFAULT_HOST),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().optional(),
  MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(DEFAULT_MAX_OUTPUT_TOKENS),
});

export type AppConfig = {
  openaiApiKey: string;
  port: number;
  host: string;
  nodeEnv: 'development' | 'test' | 'production';
  corsOrigin: boolean | string[];
  maxOutputTokens: number;
};

function parseCorsOrigin(raw: string | undefined): boolean | string[] {
  if (!raw || raw === '*') {
    return true;
  }

  const origins = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    const missingKey = parsed.error.issues.some((issue) => issue.path[0] === 'OPENAI_API_KEY');
    if (missingKey) {
      throw new ConfigError(
        'OPENAI_API_KEY is missing. Set it in the environment or a .env file before starting the server.',
      );
    }

    throw new ConfigError('Invalid environment configuration.');
  }

  const data = parsed.data;

  return {
    openaiApiKey: data.OPENAI_API_KEY,
    port: data.PORT,
    host: data.HOST,
    nodeEnv: data.NODE_ENV,
    corsOrigin: parseCorsOrigin(data.CORS_ORIGIN),
    maxOutputTokens: data.MAX_OUTPUT_TOKENS,
  };
}

export function isProduction(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === 'production';
}
