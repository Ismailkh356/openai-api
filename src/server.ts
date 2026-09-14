import type { Server } from 'node:http';
import dotenv from 'dotenv';
import { ConfigError, isProduction, loadConfig } from './config/env.js';
import { logger } from './config/logger.js';
import { createApp } from './app.js';
import { createOpenAIChatService, createUnconfiguredChatService } from './services/openai.js';

dotenv.config();

export function startServer(env: NodeJS.ProcessEnv = process.env): Server {
  try {
    const config = loadConfig(env);
    const app = createApp({
      chatService: createOpenAIChatService(config),
      corsOrigin: config.corsOrigin,
    });

    return app.listen(config.port, config.host, () => {
      logger.info('server.listening', { host: config.host, port: config.port });
    });
  } catch (error) {
    const message =
      error instanceof ConfigError
        ? error.message
        : 'Failed to start the server because configuration is invalid.';

    console.error(`Fatal: ${message}`);
    logger.error('startup.failed', { reason: 'invalid_config' });

    if (isProduction(env)) {
      process.exit(1);
    }

    console.error('Starting in degraded mode. POST /v1/chat will fail until OPENAI_API_KEY is set.');

    const port = Number(env.PORT ?? 3000);
    const host = env.HOST ?? '0.0.0.0';
    const app = createApp({ chatService: createUnconfiguredChatService() });

    return app.listen(port, host, () => {
      logger.info('server.listening', { host, port, degraded: true });
    });
  }
}

if (process.env.VITEST !== 'true') {
  startServer();
}
