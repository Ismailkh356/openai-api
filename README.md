# GPT-6 Astra API Service

Production-ready Node.js API that exposes OpenAI's **GPT-6 Astra** model through a clean, RapidAPI-ready HTTP interface.

Clients never receive or see the OpenAI API key.

```text
Client → RapidAPI → this API → OpenAI Responses API → this API → Client
```

## What the API does

- Accepts a chat request at `POST /v1/chat`
- Validates the payload with Zod
- Calls OpenAI using the official Node SDK and the **Responses API**
- Uses model id `gpt-6-astra`
- Returns only a sanitized JSON envelope:

```json
{
  "success": true,
  "model": "gpt-6-astra",
  "response": "..."
}
```

Internal OpenAI objects, stack traces, and secrets are never returned.

`GET /health` is a liveness check and does **not** call OpenAI.

## Requirements

- Node.js 22+
- An OpenAI API key with access to `gpt-6-astra`

## Installation

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `OPENAI_API_KEY`.

## Environment variables

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | yes | — | Server-side OpenAI key. Never committed. Never returned. |
| `PORT` | no | `3000` | HTTP port |
| `HOST` | no | `0.0.0.0` | Bind address |
| `NODE_ENV` | no | `development` | `development`, `test`, or `production` |
| `CORS_ORIGIN` | no | `*` | Comma-separated origins, or `*` |
| `MAX_OUTPUT_TOKENS` | no | `4096` | Server-side completion cap |

`.env` is gitignored. `.env.example` contains only placeholders:

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

In production, if `OPENAI_API_KEY` is missing the process **exits on startup**. In development the HTTP server still starts so `/health` and docs remain available, but `POST /v1/chat` returns `MISSING_API_CONFIGURATION`.

## How to run locally

```bash
npm run dev
```

This starts the TypeScript server with reload.

Production-style run:

```bash
npm run build
npm start
```

`npm start` sets `NODE_ENV=production` and requires `OPENAI_API_KEY`.

## How to test `/health`

```bash
curl http://localhost:3000/health
```

Expected:

```json
{"status":"ok"}
```

## How to test `/v1/chat`

```bash
curl -X POST http://localhost:3000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain DNS in simple terms",
    "reasoning_effort": "low"
  }'
```

`system` is optional. `reasoning_effort` accepts the values officially supported by GPT-6 Astra:

- `low`
- `medium`
- `high`
- `xhigh`
- `max`

If omitted, the service defaults to **`low`**. That is a cost-aware product default, not OpenAI's own `medium` default.

## Example response

```json
{
  "success": true,
  "model": "gpt-6-astra",
  "response": "DNS is the internet's phone book..."
}
```

Error envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "message is required"
  }
}
```

## How OpenAI authentication works

1. The server reads `OPENAI_API_KEY` from the environment.
2. The official OpenAI Node SDK is constructed **only on the server**.
3. Requests are sent to the Responses API:

```ts
await client.responses.create({
  model: 'gpt-6-astra',
  input: message,
  instructions: system,
  reasoning: { effort: reasoningEffort },
  max_output_tokens: 4096,
});
```

4. The SDK response is reduced to `output_text`.
5. The client receives `{ success, model, response }` only.

The OpenAI key is never:

- written into source
- logged
- included in JSON responses
- forwarded to RapidAPI consumers

## Security considerations

- Helmet, CORS, and a 32kb JSON body limit
- Zod validation with maximum input sizes (`message` ≤ 16,000 chars, `system` ≤ 4,000)
- No stack traces in API responses
- Logs record lengths and error codes, never prompts or secrets
- Missing/invalid provider credentials become generic 500s
- Rate limits become `429` with a safe message
- Structured so request quotas and usage tracking can be added later without changing the public contract

GPT-6 Astra is expensive. This service does **not** invent a fixed per-request price. Cost depends on tokens used, reasoning effort, and output length.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | TypeScript watch server |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled server |
| `npm test` | Vitest unit tests (OpenAI mocked) |
| `npm run test:integration` | Optional live OpenAI test |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

Unit tests never call OpenAI. To run a live check:

```bash
OPENAI_API_KEY=sk-... RUN_OPENAI_INTEGRATION=1 npm run test:integration
```

## How to deploy the service

1. Copy `.env.example` into the host's secret store. Do not bake the key into an image.
2. Set `NODE_ENV=production`, `OPENAI_API_KEY`, and `PORT`.
3. Run `npm run build && npm start`.
4. Put TLS and a reverse proxy in front of the process.
5. Keep the health check pointed at `GET /health`.
6. Import `openapi.yaml` when publishing.

Suitable hosts include a VPS, Render, Fly.io, Railway, or any Node 22 process manager. RapidAPI will call the public HTTPS origin.

## How this connects to RapidAPI

Do **not** put RapidAPI credentials or OpenAI credentials in source control.

Recommended later wiring:

```text
RapidAPI (API key / plan / rate limits)
   ↓
POST /v1/chat
   ↓
this API
   ↓
OpenAI Responses API (gpt-6-astra)
```

This repository intentionally does **not** implement RapidAPI authentication yet. The HTTP contract is stable and independently testable. `openapi.yaml` is the import surface for RapidAPI.

When RapidAPI is added:

- Keep OpenAI auth server-side
- Verify RapidAPI proxy headers at the edge
- Add per-plan quotas in front of `POST /v1/chat`
- Continue returning the same JSON envelopes
