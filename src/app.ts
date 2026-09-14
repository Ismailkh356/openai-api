import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { JSON_BODY_LIMIT } from './config/constants.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { createChatRouter } from './routes/chat.js';
import { docsRouter } from './routes/docs.js';
import { healthRouter } from './routes/health.js';
import { createUnconfiguredChatService, type ChatService } from './services/openai.js';

export type CreateAppOptions = {
  chatService?: ChatService;
  corsOrigin?: boolean | string[];
};

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  const chatService = options.chatService ?? createUnconfiguredChatService();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://grok.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'", 'https://grok.com'],
          frameSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: options.corsOrigin ?? true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-RapidAPI-Key', 'X-RapidAPI-Host'],
      maxAge: 600,
    }),
  );

  app.use(express.json({ limit: JSON_BODY_LIMIT, strict: true }));

  app.use('/', docsRouter);
  app.use('/health', healthRouter);
  app.use('/v1/chat', createChatRouter(chatService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
