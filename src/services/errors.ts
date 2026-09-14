import OpenAI from 'openai';
import { logger } from '../config/logger.js';
import { AppError } from '../middleware/error-handler.js';

export function mapProviderError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof OpenAI.RateLimitError) {
    logger.error('openai.rate_limit', { status: error.status });
    return new AppError(
      429,
      'OPENAI_RATE_LIMIT',
      'The model is currently rate limited. Please retry shortly.',
    );
  }

  if (error instanceof OpenAI.AuthenticationError || error instanceof OpenAI.PermissionDeniedError) {
    logger.error('openai.auth_failure', { status: error.status });
    return new AppError(
      500,
      'OPENAI_AUTHENTICATION_ERROR',
      'The service is not configured correctly. Please try again later.',
    );
  }

  if (error instanceof OpenAI.APIConnectionError) {
    logger.error('openai.connection', {
      timeout: error instanceof OpenAI.APIConnectionTimeoutError,
    });
    return new AppError(
      502,
      'OPENAI_API_ERROR',
      'Unable to reach the model provider. Please try again later.',
    );
  }

  if (error instanceof OpenAI.APIError) {
    const status = error.status ?? 502;

    if (status === 429) {
      return new AppError(
        429,
        'OPENAI_RATE_LIMIT',
        'The model is currently rate limited. Please retry shortly.',
      );
    }

    if (status >= 500) {
      logger.error('openai.upstream_5xx', { status });
      return new AppError(
        502,
        'OPENAI_API_ERROR',
        'The model provider returned an error. Please try again later.',
      );
    }

    logger.error('openai.upstream', { status });
    return new AppError(
      502,
      'OPENAI_API_ERROR',
      'The model provider rejected the request. Please try again later.',
    );
  }

  logger.error('openai.unhandled', {
    name: error instanceof Error ? error.name : 'unknown',
  });

  return new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
}
