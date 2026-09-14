export const MODEL_ID = 'gpt-6-astra' as const;

export const REASONING_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

/** Cost-aware default. OpenAI's own default is medium; we start lower. */
export const DEFAULT_REASONING_EFFORT: ReasoningEffort = 'low';

export const MAX_MESSAGE_LENGTH = 16_000;
export const MAX_SYSTEM_LENGTH = 4_000;
export const JSON_BODY_LIMIT = '32kb';
export const DEFAULT_MAX_OUTPUT_TOKENS = 4_096;
export const DEFAULT_PORT = 3000;
export const DEFAULT_HOST = '0.0.0.0';
export const OPENAI_TIMEOUT_MS = 120_000;
export const OPENAI_MAX_RETRIES = 1;
