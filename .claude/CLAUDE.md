# CLAUDE.md -- Jotil Chat

This file provides Claude Code with project context, conventions, and rules for developing Jotil Chat.

## Project Summary

Jotil Chat is an embeddable AI chat widget for business websites. Visitors interact with an AI chatbot customized to the business. The system is multi-tenant: one deployment serves all clients, differentiated by a clientId on each request.

Phase 1 is a productized service. No client dashboard, no self-serve signup, no billing integration. Clients are added manually via Supabase. The focus is the widget and the backend API.

## Tech Stack

- **Widget:** Preact, built with Vite into a single JS file (target under 15KB gzipped)
- **Backend:** Next.js (App Router) on Vercel
- **AI:** Vercel AI SDK for multi-provider model routing and token streaming
- **Database:** Supabase (PostgreSQL)
- **Language:** TypeScript throughout
- **Runtime:** Edge runtime for streaming API routes, Node runtime for non-streaming routes

## Project Structure

The project has two build targets:

1. `src/` -- Next.js application (API routes, future dashboard pages)
2. `widget/` -- Preact widget (separate Vite build, outputs a single JS bundle)

These share TypeScript types from `src/types/`.

Key directories:

```
src/app/api/chat/route.ts       -- Main streaming chat endpoint
src/app/api/config/route.ts     -- Widget configuration endpoint
src/lib/ai/providers.ts         -- AI provider setup and streamText wrapper
src/lib/ai/prompts.ts           -- System prompt builder
src/lib/ai/models.ts            -- Model registry (names, strings, plan access)
src/lib/db/supabase.ts          -- Supabase client
src/lib/db/queries.ts           -- All database queries
widget/src/App.tsx               -- Widget root component
widget/src/components/           -- Widget UI components
widget/src/hooks/useChat.ts      -- Chat state, SSE streaming, message management
widget/src/hooks/useConfig.ts    -- Fetch widget config on load
widget/src/utils/markdown.ts     -- Safe markdown renderer
widget/src/utils/contrast.ts     -- Auto-contrast color logic
```

## Coding Conventions

### General

- TypeScript strict mode enabled. No `any` types unless absolutely unavoidable and commented.
- Use named exports, not default exports, except for Next.js page/route files which require default exports.
- Prefer `const` over `let`. Never use `var`.
- Use early returns to reduce nesting.
- Error messages should be user-friendly in API responses and developer-friendly in logs.

### Naming

- Files: kebab-case (`message-bubble.tsx`, `rate-limit.ts`)
- Components: PascalCase (`MessageBubble`, `ChatPanel`)
- Functions and variables: camelCase
- Database columns: snake_case
- Environment variables: SCREAMING_SNAKE_CASE
- Types and interfaces: PascalCase, no `I` prefix

### Next.js API Routes

- All API routes live under `src/app/api/`.
- Use the App Router route handler pattern (`export async function POST(req: Request)`).
- The `/api/chat` route must use Edge runtime for streaming: `export const runtime = 'edge';`
- Validate all incoming request bodies. Return 400 with a clear message for invalid input.
- Always validate `clientId` and check that the client is active before processing.
- Check the Origin header against the client's registered domain.

### Vercel AI SDK Usage

- Use `streamText` from the `ai` package for all chat completions.
- Pass the model as a string (e.g., `"openai/gpt-5-nano"`) to use the Vercel AI Gateway.
- Return `result.toDataStreamResponse()` from streaming routes.
- Do not use the AI SDK's `useChat` hook in the widget. The widget uses Preact, not React. Write a custom `useChat` hook that reads the AI SDK's data stream format.
- System prompts are built dynamically per request using `buildSystemPrompt()` from `src/lib/ai/prompts.ts`.

### Widget (Preact)

- The widget runs inside a Shadow DOM on the host page. All styles must be injected into the shadow root, not the document head.
- No global CSS. All styles are scoped to the widget.
- The widget must not interfere with the host page. No global event listeners, no document-level style changes, no console.log in production.
- Use Preact's `h` function or JSX. Import hooks from `preact/hooks`.
- The widget bundle must remain under 15KB gzipped. Do not add heavy dependencies. If a library is needed, consider whether a lightweight alternative or custom implementation is smaller.
- Markdown rendering is custom-built (see `widget/src/utils/markdown.ts`). Do not use marked, markdown-it, or similar libraries. They are too large for the widget budget.
- All rendered HTML from markdown must be sanitized. No raw HTML injection. Links must be http/https only.

### Database

- All database access goes through functions in `src/lib/db/queries.ts`. No inline Supabase queries in API routes.
- Use parameterized queries. Never concatenate user input into query strings.
- The Supabase client is initialized in `src/lib/db/supabase.ts` using the service role key (server-side only).
- Never expose the Supabase service role key to the client side.

### Error Handling

- API routes: wrap the main logic in try/catch. Return appropriate HTTP status codes.
- Widget: display inline error messages (light red background, retry button). Never crash the widget or show a blank screen.
- AI provider errors: return 502 to the widget with a generic message. Log the actual error server-side.
- Rate limit errors: return 429 with a human-readable message.

## Key Design Decisions

### Why Preact instead of React
The widget loads on third-party websites. React is ~40KB gzipped. Preact is ~3KB. The widget JS budget is 15KB total.

### Why Shadow DOM
The widget must look consistent regardless of the host page's CSS. Shadow DOM provides complete style isolation in both directions.

### Why Edge Runtime for /api/chat
SSE streaming benefits from Edge runtime's lower cold start latency on Vercel. Non-streaming routes use Node runtime.

### Why custom useChat instead of the AI SDK's useChat
The AI SDK's `useChat` hook depends on React. The widget uses Preact. A custom hook reads the same data stream format but uses Preact's state primitives.

### Why custom markdown renderer
Existing markdown libraries (marked, markdown-it) are 20-50KB. The widget only needs bold, italic, links, lists, code, and blockquotes. A custom renderer handling this subset fits in under 2KB.

## Documentation References

When working on this project, refer to these documents in the `docs/` directory:

- `technical-architecture.md` -- System design, database schema, API specs, deployment model
- `widget-design-spec.md` -- Widget states, animations, colors, typography, accessibility, mobile behavior
- `prompt-library.md` -- System prompt templates, client context injection, guardrails
- `onboarding-runbook.md` -- Steps for adding a new client

## Git Conventions

- Use conventional commit format for all commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `style:`.
- Keep commit subject lines under 72 characters.
- Write a blank line after the subject, then a short body explaining why the change was made (not just what changed).
- Commit early and often. One logical change per commit. Do not bundle unrelated changes into a single commit.
- Use feature branches for any new feature or significant change. Branch naming: `feat/short-description`, `fix/short-description`, `refactor/short-description`.
- Always run `npm run typecheck` and `npm run lint` before committing. Do not commit code that fails either check.
- Do not commit `.env.local` or any file containing secrets.

## Code Quality Standards

- All new code must pass TypeScript strict mode with no errors.
- All API routes must validate input and return proper HTTP status codes.
- No `console.log` in production code. Use it during development only and remove before committing.
- Functions should be small and do one thing. If a function exceeds 40 lines, consider splitting it.
- Avoid deep nesting. Use early returns.
- All exported functions should have a brief JSDoc comment explaining what they do.
- Write code that is readable first, clever second.

## Testing

- Write tests for all utility functions (`src/lib/utils/`, `widget/src/utils/`).
- Write tests for database query functions (`src/lib/db/queries.ts`).
- Write tests for the prompt builder (`src/lib/ai/prompts.ts`).
- Use Vitest as the test runner.
- Test file naming: `[filename].test.ts` colocated with the source file.
- Run tests with `npm run test` before committing.
- The seed database includes a test client with ID `00000000-0000-0000-0000-000000000001` and domain `localhost`. Use this for all local development and testing.
- The widget dev server (`npm run widget:dev`) should auto-load with the test client ID so you can test the full flow without manual configuration.
- For testing without burning AI tokens, add a `MOCK_AI=true` environment variable that returns a canned streaming response instead of calling the real AI provider. This flag should only work in development.

## Dependencies

- Do not add new dependencies without justification. Every dependency adds to bundle size and maintenance burden.
- For the widget (`widget/`), this is especially critical. The total bundle must stay under 15KB gzipped. Before adding any dependency to the widget, check its gzipped size.
- Prefer the Vercel AI SDK for all AI-related functionality. Do not use the OpenAI SDK, Anthropic SDK, or Google SDK directly. The Vercel AI SDK wraps all of them with a unified API.
- For the backend, use the Vercel AI SDK's `streamText`, `generateText`, and related functions. Do not write raw fetch calls to AI provider APIs.

## Vercel AI SDK Usage (Critical)

This project depends heavily on the Vercel AI SDK (`ai` package). It is the core abstraction for all AI interactions. Follow these rules strictly:

- Import from `ai` for server-side functions: `streamText`, `generateText`, `generateObject`.
- Use the Vercel AI Gateway model strings (e.g., `"openai/gpt-5-nano"`, `"anthropic/claude-haiku-4-5"`, `"google/gemini-2.0-flash"`). This allows model switching with zero code changes.
- Return `result.toDataStreamResponse()` from streaming API routes. This is the standard response format the widget's custom `useChat` hook will parse.
- Do not use the AI SDK's built-in `useChat` React hook in the widget. The widget uses Preact. Write a custom hook that reads the AI SDK's data stream protocol.
- For the custom widget `useChat` hook, parse the AI SDK's data stream format which uses prefixed lines (type indicators like `0:` for text tokens). Refer to the AI SDK source or documentation for the exact protocol.
- All AI provider API keys are stored as Vercel environment variables and accessed server-side only. Never import or reference them in widget code.
- When adding support for a new AI model, update `src/lib/ai/models.ts` (model registry) and the Prompt Library documentation. No other code changes should be needed if the Vercel AI SDK supports the provider.

## Commands

```bash
# Development
npm run dev              # Start Next.js dev server
npm run widget:dev       # Start widget dev server (Vite)
npm run widget:build     # Build widget bundle

# Database
npx supabase db push     # Apply migrations
npx supabase db reset    # Reset and reseed

# Type checking
npm run typecheck        # Run tsc --noEmit across both src/ and widget/

# Testing
npm run test             # Run Vitest

# Linting
npm run lint             # ESLint across the project
```

## Environment Variables

Required in `.env.local`:

```
OPENAI_API_KEY           -- OpenAI API key
ANTHROPIC_API_KEY        -- Anthropic API key
GOOGLE_AI_API_KEY        -- Google AI API key
SUPABASE_URL             -- Supabase project URL
SUPABASE_SERVICE_ROLE_KEY -- Supabase service role key (server-side only)
NEXT_PUBLIC_WIDGET_URL   -- Public URL where the widget JS is served
```

## Things to Watch Out For

- The widget and the Next.js app are separate build targets. Changes to shared types in `src/types/` affect both.
- The Vercel AI SDK's data stream format is not plain text SSE. The custom `useChat` hook in the widget must parse the SDK's specific format (prefixed lines with type indicators).
- Shadow DOM does not inherit fonts from the host page. The widget must declare its own font stack in its injected styles.
- On mobile (below 640px viewport), the widget switches to full-screen overlay mode. Test this path separately.
- Rate limiting in Phase 1 uses in-memory storage. This resets on each Vercel deployment and does not share state across Edge function instances. Acceptable for 10-15 clients. Upgrade to Vercel KV if this becomes a problem.