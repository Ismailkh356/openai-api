import { z } from 'zod';
import {
  MAX_MESSAGE_LENGTH,
  MAX_SYSTEM_LENGTH,
  REASONING_EFFORTS,
} from '../config/constants.js';

export const reasoningEffortSchema = z.enum(REASONING_EFFORTS);

export const chatRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(1, 'message is required')
      .max(MAX_MESSAGE_LENGTH, `message must be at most ${MAX_MESSAGE_LENGTH} characters`),
    system: z
      .string()
      .trim()
      .min(1, 'system must not be empty')
      .max(MAX_SYSTEM_LENGTH, `system must be at most ${MAX_SYSTEM_LENGTH} characters`)
      .optional(),
    reasoning_effort: reasoningEffortSchema.optional(),
  })
  .strict();

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export function formatValidationMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return 'Invalid request body';
  }

  const field = issue.path.map(String).join('.') || 'request';

  if (field === 'message' && (issue.code === 'invalid_type' || issue.code === 'too_small')) {
    return 'message is required';
  }

  if (field === 'reasoning_effort') {
    return 'reasoning_effort must be one of: low, medium, high, xhigh, max';
  }

  if (issue.code === 'unrecognized_keys') {
    return 'Request contains unsupported fields';
  }

  return issue.message;
}
