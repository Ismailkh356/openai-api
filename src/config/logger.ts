const BLOCKED_KEYS =
  /^(message|prompt|input|content|system|authorization|api[_-]?key|secret|token|password|openai)$/i;
const SECRET_PATTERN = /sk-[a-zA-Z0-9_-]{8,}/g;

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(SECRET_PATTERN, '[redacted]');
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return sanitize(value as Record<string, unknown>);
  }

  return value;
}

function sanitize(meta?: Record<string, unknown>): Record<string, unknown> {
  if (!meta) {
    return {};
  }

  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (BLOCKED_KEYS.test(key)) {
      continue;
    }

    output[key] = sanitizeValue(value);
  }

  return output;
}

function write(level: 'info' | 'error', event: string, meta?: Record<string, unknown>): void {
  const payload = JSON.stringify({
    level,
    event,
    ts: new Date().toISOString(),
    ...sanitize(meta),
  });

  if (level === 'error') {
    console.error(payload);
    return;
  }

  console.log(payload);
}

export const logger = {
  info(event: string, meta?: Record<string, unknown>): void {
    write('info', event, meta);
  },
  error(event: string, meta?: Record<string, unknown>): void {
    write('error', event, meta);
  },
};
