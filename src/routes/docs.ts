import { existsSync } from 'node:fs';
import path from 'node:path';
import { Router } from 'express';

function resolveExisting(...candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export const docsRouter = Router();

docsRouter.get('/', (_req, res, next) => {
  const file = resolveExisting(
    path.join(process.cwd(), 'src', 'public', 'index.html'),
    path.join(process.cwd(), 'dist', 'public', 'index.html'),
  );

  if (!file) {
    next(new Error('API documentation page is missing.'));
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(file);
});

docsRouter.get('/openapi.yaml', (_req, res, next) => {
  const file = path.join(process.cwd(), 'openapi.yaml');
  if (!existsSync(file)) {
    next(new Error('OpenAPI specification is missing.'));
    return;
  }

  res.setHeader('Content-Type', 'application/yaml; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(file);
});
