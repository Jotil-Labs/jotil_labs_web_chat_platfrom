# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

Jotil Chat is an embeddable AI chat widget for business websites. Multi-tenant: one deployment serves all clients, differentiated by `clientId` on each request. Phase 1 is a productized service — no dashboard, no self-serve, no billing. Clients added manually via Supabase.

## Architecture

Two separate build targets sharing types from `src/types/`:

1. **`src/`** — Next.js App Router backend (API routes, Vercel deployment)
2. **`widget/`** — Preact widget (Vite build → single JS bundle, under 15KB gzipped)

### Request Flow

Widget loads → `GET /api/config?clientId=X` (fetches theme/config) → renders in Shadow DOM → user sends message → `POST /api/chat` (validates client, builds prompt, calls AI via Vercel AI SDK `streamText`) → SSE token stream back to widget → tokens rendered in real time → messages persisted to Supabase after stream completes.

### Key Files

```
src/app/api/chat/route.ts       — Streaming chat endpoint (Edge runtime)
src/app/api/config/route.ts     — Widget configuration endpoint
src/app/api/feedback/route.ts   — Message feedback (thumbs up/down)
src/app/api/conversations/route.ts — Conversation history
src/lib/ai/providers.ts         — streamText wrapper
src/lib/ai/prompts.ts           — System prompt builder (passes DB prompt through, appends document_context)
src/lib/ai/models.ts            — Model registry (provider strings, plan access)
src/lib/db/supabase.ts          — Supabase client (service role, server-side only)
src/lib/db/queries.ts           — All database queries (no inline Supabase queries elsewhere)
src/lib/utils/rate-limit.ts     — Rate limiting (in-memory, per-visitor + per-client monthly)
src/lib/utils/validation.ts     — Input validation
src/types/index.ts              — Shared TypeScript types (used by both src/ and widget/)
widget/src/App.tsx              — Widget root component
widget/src/hooks/useChat.ts     — Custom chat hook (SSE streaming, NOT the AI SDK's useChat)
widget/src/hooks/useConfig.ts   — Fetch widget config on load
widget/src/utils/markdown.ts    — Custom safe markdown renderer (no external libs)
widget/src/utils/contrast.ts    — Auto-contrast color logic
```

### Database Schema (Supabase PostgreSQL)

Three tables: `clients` (config, plan, usage limits, active flag, starter_questions JSONB), `conversations` (client_id, visitor_id, timestamps), `messages` (conversation_id, role, content, model_used, tokens_used, feedback). Full schema in `docs/technical_architecture.md`.

## Commands

```bash
npm run dev              # Next.js dev server
npm run widget:dev       # Widget dev server (Vite, auto-loads test client)
npm run widget:build     # Build widget bundle
npm run typecheck        # tsc --noEmit (both src/ and widget/)
npm run test             # Vitest
npm run lint             # ESLint
npx supabase db push     # Apply migrations
npx supabase db reset    # Reset and reseed
```

Run `npm run typecheck` and `npm run lint` before every commit.

## Critical Constraints

### Widget Bundle Budget
Total widget JS must stay under 15KB gzipped. Preact (~3KB) is used instead of React (~40KB). No heavy dependencies. Custom markdown renderer instead of marked/markdown-it. Check gzipped size before adding any widget dependency.

### Shadow DOM Isolation
Widget runs inside Shadow DOM. All styles injected into shadow root, not document head. No global CSS, no global event listeners, no document-level side effects. Shadow DOM does not inherit host fonts — widget declares its own font stack.

### Custom useChat Hook (Not AI SDK's)
The AI SDK's `useChat` requires React. Widget uses Preact. A custom hook at `widget/src/hooks/useChat.ts` parses the AI SDK's UI message stream (SSE events):
- `data: {"type":"text-delta","delta":"..."}` → text token
- `data: {"type":"error","errorText":"..."}` → error
- `data: {"type":"finish",...}` → finish signal
- `data: [DONE]` → stream complete

### Edge Runtime for /api/chat
The chat endpoint uses Edge runtime (`export const runtime = 'edge'`) for lower cold start latency on SSE streaming. Non-streaming routes use Node runtime.

### Vercel AI SDK Usage
- Import `streamText`, `generateText`, `generateObject` from `ai` package
- Use provider/model strings: `"openai/gpt-5-nano"`, `"anthropic/claude-haiku-4-5"`, `"google/gemini-2.0-flash"`
- Return `result.toUIMessageStreamResponse({ onFinish, onError })` from streaming routes — `onFinish` persists messages, `onError` returns user-facing error string
- Never import AI provider SDKs directly — the Vercel AI SDK wraps all of them
- API keys are server-side Vercel env vars only, never referenced in widget code
- Adding a new model = update `src/lib/ai/models.ts` only

### Database Access Pattern
All queries go through `src/lib/db/queries.ts`. No inline Supabase calls in API routes. Parameterized queries only. The Supabase service role key is server-side only.

## Coding Conventions

### Naming
- Files: kebab-case (`message-bubble.tsx`)
- Components: PascalCase (`MessageBubble`)
- Functions/variables: camelCase
- DB columns: snake_case
- Env vars: SCREAMING_SNAKE_CASE
- Types: PascalCase, no `I` prefix

### Exports
Named exports everywhere, except Next.js page/route files (default exports required).

### API Routes
- App Router pattern: `export async function POST(req: Request)`
- Always validate `clientId`, check client is active, check Origin against registered domain
- Error codes: 400 (bad input), 403 (inactive client/wrong origin), 404 (unknown client), 429 (rate limited / AI provider throttled), 502 (AI provider error with generic message to client)
- AI SDK error types (`APICallError`, `RetryError`, `LoadAPIKeyError`) are caught and mapped to specific user-facing messages — never expose internal error details

### Widget Error Handling
Inline error messages (light red `#FEF2F2` background, retry button). Never crash the widget or show blank screen.

## Testing

- Vitest as test runner
- Test files colocated: `[filename].test.ts`
- Test client ID: `00000000-0000-0000-0000-000000000001` (domain: `localhost`)

## Git Conventions

- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `style:`
- Branch naming: `feat/short-description`, `fix/short-description`, `refactor/short-description`

## Environment Variables

Required in `.env.local`:
```
OPENAI_API_KEY
ANTHROPIC_API_KEY
GOOGLE_AI_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_WIDGET_URL
```

## Documentation

Refer to `docs/` for detailed specs:
- `technical_architecture.md` — System design, full DB schema, API specs, deployment
- `widget_design.md` — Widget states, animations, colors, typography, accessibility, mobile
- `prompt_library.md` — System prompt templates, client context injection, guardrails
- `customer_onboarding.md` — Steps for adding a new client

## Gotchas

- Widget and Next.js are separate builds. Changes to `src/types/` affect both.
- The AI SDK UI message stream uses SSE format (`data: <JSON>\n\n`) with typed events (text-delta, error, finish, etc.).
- On mobile (below 640px), widget switches to full-screen overlay. Test separately.
- Rate limiting is in-memory — resets on deploy, no cross-instance state. Fine for 10-15 clients.
- Widget's markdown renderer returns a DOM DocumentFragment (not HTML string) to avoid innerHTML.
- `prefers-reduced-motion` must be respected — replace all animations with instant state changes.

## Auto-Commit

Always commit after completing a task or a logical unit of work. Use conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `style:`). Do not wait for the user to ask — commit proactively when the work is done and tests/typecheck pass.
