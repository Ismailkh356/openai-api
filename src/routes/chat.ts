import { Router } from 'express';
import { DEFAULT_REASONING_EFFORT } from '../config/constants.js';
import { logger } from '../config/logger.js';
import { validateBody } from '../middleware/validate.js';
import { chatRequestSchema, type ChatRequest } from '../schemas/chat.js';
import type { ChatService } from '../services/openai.js';

export function createChatRouter(chatService: ChatService): Router {
  const router = Router();

  router.post('/', validateBody(chatRequestSchema), async (req, res, next) => {
    try {
      const { message, system, reasoning_effort: reasoningEffort } = req.body as ChatRequest;
      const effort = reasoningEffort ?? DEFAULT_REASONING_EFFORT;

      logger.info('chat.request', {
        messageLength: message.length,
        hasSystem: Boolean(system),
        reasoningEffort: effort,
      });

      const result = await chatService.createChat({
        message,
        system,
        reasoningEffort: effort,
      });

      res.status(200).json({
        success: true,
        model: result.model,
        response: result.response,
      });
    } catch (error) {
      next(error);
    }
  });

  router.all('/', (_req, res) => {
    res.set('Allow', 'POST');
    res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Use POST /v1/chat.',
      },
    });
  });

  return router;
}
