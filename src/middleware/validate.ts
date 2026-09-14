import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { formatValidationMessage } from '../schemas/chat.js';
import { AppError } from './error-handler.js';

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body === undefined || req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
      next(new AppError(400, 'VALIDATION_ERROR', 'Request body must be a JSON object'));
      return;
    }

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(new AppError(400, 'VALIDATION_ERROR', formatValidationMessage(parsed.error)));
      return;
    }

    req.body = parsed.data;
    next();
  };
}
