# Jotil Chat

Embeddable AI chat widget for business websites. One deployment serves all clients, differentiated by `clientId`.

## Architecture

Two separate build targets:

- **`src/`** — Next.js App Router backend (API routes, Vercel deployment)
- **`widget/`** — Preact widget (Vite build, single JS bundle under 15KB gzipped)

Widget loads on a client's website via a script tag, fetches config from `/api/config`, renders in Shadow DOM, and streams AI responses from `/api/chat` via SSE.

## Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project (free tier works)
- At least one AI provider API key (OpenAI, Anthropic, or Google)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd jotil_labs_web_chat_platfrom
npm install
```

### 2. Environment variables

Copy the example and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables in `.env.local`:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...        # optional if not using Anthropic models
GOOGLE_AI_API_KEY=AIza...           # optional if not using Google models
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_WIDGET_URL=http://localhost:3000
```

### 3. Database setup

Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if you haven't:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push     # apply migrations
```

To seed the test client (Test Coffee Shop on localhost):

```bash
npx supabase db reset    # resets DB and runs seed.sql
```

### 4. Run development servers

You need two terminals:

```bash
# Terminal 1: Next.js backend (port 3000)
npm run dev

# Terminal 2: Widget dev server (port 5173)
npm run widget:dev
```

Open **http://localhost:5173** to see the widget with the test client.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server (port 3000) |
| `npm run widget:dev` | Widget dev server with hot reload (port 5173) |
| `npm run widget:build` | Build widget bundle to `widget/build/widget.js` |
| `npm run typecheck` | TypeScript check (both `src/` and `widget/`) |
| `npm run test` | Run all tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run build` | Production build (Next.js) |

## Testing

```bash
npm run test          # single run
npm run test:watch    # watch mode
```

Test client ID: `00000000-0000-0000-0000-000000000001` (domain: `localhost`)

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local` to the Vercel project settings
4. Set `NEXT_PUBLIC_WIDGET_URL` to your production URL (e.g. `https://chat.jotil.com`)
5. Deploy — Vercel handles the Next.js build automatically

The `/api/chat` endpoint runs on Edge runtime for low-latency streaming.

### Widget bundle

```bash
npm run widget:build
```

Output: `widget/build/widget.js`. Host this file on your CDN or serve it from the Next.js public directory.

### Client website integration

Clients add a single script tag:

```html
<script
  src="https://your-domain.com/widget.js"
  data-client-id="<client-uuid>"
  defer
></script>
```

## Adding a new client

1. Insert a row into the `clients` table in Supabase (see `docs/customer_onboarding.md` for the full checklist)
2. Set `domain` to the client's website domain
3. Set `system_prompt` with business-specific knowledge
4. Provide the client with their embed script tag

## Project structure

```
src/
  app/api/chat/route.ts        # Streaming chat endpoint (Edge)
  app/api/config/route.ts      # Widget config endpoint
  app/api/feedback/route.ts    # Message feedback
  app/api/conversations/route.ts
  lib/ai/providers.ts          # streamText wrapper
  lib/ai/prompts.ts            # System prompt builder
  lib/ai/models.ts             # Model registry
  lib/db/queries.ts            # All database queries
  lib/utils/rate-limit.ts      # Rate limiting
  lib/utils/validation.ts      # Input validation
  types/index.ts               # Shared types (used by both src/ and widget/)

widget/
  src/App.tsx                  # Widget root
  src/hooks/useChat.ts         # Custom chat hook (SSE streaming)
  src/hooks/useConfig.ts       # Config fetcher
  src/utils/markdown.ts        # Safe markdown renderer
  src/styles/widget.css        # All widget styles

docs/
  technical_architecture.md    # System design, DB schema, API specs
  widget_design.md             # UI states, animations, accessibility
  widget_customization.md      # Theming and customization guide
  prompt_library.md            # System prompt templates
  customer_onboarding.md       # Steps for adding a new client
```

## Documentation

See `docs/` for detailed specs:

- [Technical Architecture](docs/technical_architecture.md) — system design, full DB schema, API specs
- [Widget Design](docs/widget_design.md) — states, animations, colors, typography, mobile
- [Widget Customization](docs/widget_customization.md) — theming, custom icons, greeting messages
- [Prompt Library](docs/prompt_library.md) — system prompt templates, guardrails
- [Customer Onboarding](docs/customer_onboarding.md) — adding a new client end-to-end
