# Socrates as a Service

A Socratic method chatbot that challenges your thinking through probing questions — never giving direct answers, only helping you discover what you think and whether it holds up to scrutiny.

Built with TanStack Start, the Vercel AI SDK, and streaming LLM responses.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Browser                                                            │
│                                                                     │
│  ┌──────────────┐    ┌──────────────────────────────────────────┐   │
│  │   Sidebar     │    │  Chat UI (src/routes/index.tsx)          │   │
│  │              │    │                                          │   │
│  │  Conversation │    │  ┌────────────────┐ ┌────────────────┐  │   │
│  │  history      │    │  │ Message Stream  │ │ Tool Renderers │  │   │
│  │  (grouped by  │    │  │ (Markdown +     │ │ (12 components)│  │   │
│  │   time)       │    │  │  streaming)     │ │                │  │   │
│  │              │    │  └────────────────┘ └────────────────┘  │   │
│  │              │    │  ┌────────────────────────────────────┐  │   │
│  │              │    │  │ Composer (text + image upload)      │  │   │
│  │              │    │  └────────────────────────────────────┘  │   │
│  └──────────────┘    └──────────────────────────────────────────┘   │
│         │                         │ useChat (POST /api/chat)        │
└─────────┼─────────────────────────┼─────────────────────────────────┘
          │                         │
          │ REST                    │ Streaming
          ▼                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Server (Nitro)                                                     │
│                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐   │
│  │ /api/conversations   │    │ /api/chat                        │   │
│  │  GET  - list          │    │  CSRF check → Rate limit → Auth  │   │
│  │  POST - create        │    │  → Input validation              │   │
│  │                      │    │  → streamText() with tools        │   │
│  │ /api/conversations/  │    │  → streaming response             │   │
│  │   :id                │    │                                   │   │
│  │  GET  - load          │    │ /api/models                      │   │
│  │  DELETE               │    │  GET - available models           │   │
│  │  /messages POST       │    │                                   │   │
│  └──────────┬───────────┘    └──────────────┬───────────────────┘   │
│             │                               │                       │
│             ▼                               ▼                       │
│  ┌──────────────────┐         ┌──────────────────────────────────┐  │
│  │  Neon PostgreSQL  │         │  LLM Provider                    │  │
│  │  (conversations,  │         │  Anthropic (Claude Sonnet 4.5)   │  │
│  │   messages,       │         │  or OpenAI (GPT-4o)              │  │
│  │   insights)       │         │                                  │  │
│  └──────────────────┘         │  + Tavily (web search)            │  │
│                               └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

### Socratic Dialogue Engine

- **Never gives direct answers** — only asks probing questions that guide you toward your own insights
- **Three interconnected roles:**
  - **Philosophical guide** — examines beliefs, arguments, and reasoning
  - **Business idea soundboard** — stress-tests entrepreneurial ideas, unit economics, competitive moats
  - **Moral ambition coach** — excavates genuine values and pushes toward specificity and commitment
- **Teaching through testing** — uses retrieval practice after 3-4 exchanges to test understanding
- **Progressive explanation** — layers concepts from simple to nuanced, checking readiness at each level

### AI-Powered Tools (12 tools)

| Tool | What it does |
|------|-------------|
| **Web Search** | Searches the web via Tavily for real-world evidence and counterexamples |
| **Save Insight** | Persists breakthrough moments to the database |
| **Devil's Advocate** | Builds the strongest possible counterargument to your position |
| **Fact Check** | Evaluates factual claims with verdict (Supported / Partial / Unsupported / Unverifiable) |
| **Logical Analysis** | Identifies logical fallacies and cognitive biases with analogies and better framings |
| **Perspective Shift** | Surfaces 3-4 stakeholder viewpoints and asks about your blind spot |
| **Argument Map** | Visualizes logical structure: claim, premises, evidence, conclusion, counterarguments |
| **Suggest Reading** | Curated book/article/paper/video recommendations with difficulty levels |
| **Discover Resources** | Finds recently published content (articles, podcasts, essays) via Tavily |
| **Draw Diagram** | Renders Mermaid diagrams (flowchart/sequence/class) via Excalidraw |
| **Retrieval Practice** | Structured recall challenges with assessment and corrected explanations |
| **Progressive Disclosure** | Multi-layered explanations from simple to complex with "go deeper" interaction |

### Chat Experience

- **Streaming responses** — token-by-token rendering in real time
- **Rich tool renderers** — each tool has a dedicated, collapsible UI component
- **Image upload** — drag-and-drop or click, up to 4 images (JPEG, PNG, GIF, WebP), 5 MB each
- **Conversation persistence** — chat history saved to Neon PostgreSQL
- **Sidebar** — browse and manage previous conversations, grouped by "Today" / "Earlier"
- **URL-based routing** — shareable conversation links via `?c=conversationId`
- **Model selector** — switch between available models at runtime
- **Starter cards** — 6 curated prompts to begin a conversation
- **Keyboard shortcuts** — Cmd/Ctrl+Enter to submit

### Multi-Model Support

| Model | Provider |
|-------|----------|
| Claude Sonnet 4.5 | Anthropic |
| Claude Haiku 3.5 | Anthropic |
| GPT-4o | OpenAI |
| GPT-4o Mini | OpenAI |

Models are filtered by which API keys are configured — only available models appear in the selector.

### Security

- **CORS/CSRF protection** — origin validation with configurable allowlist
- **Rate limiting** — sliding window, 20 requests/min per IP (in-memory)
- **Clerk authentication** — session-based auth for app and API routes
- **Input validation** — max 100 messages, 10K chars/text, 4 files/message, 5 MB/file
- **Request size limit** — 5 MB max body

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **pnpm** — install with `npm install -g pnpm`
- A [Clerk](https://clerk.com/) application (publishable + secret keys)
- An API key from **one** of the following providers:
  - [Anthropic](https://console.anthropic.com/) (default — uses Claude Sonnet 4.5)
  - [OpenAI](https://platform.openai.com/) (uses GPT-4o)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/socrates.git
cd socrates

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
# Clerk auth keys:
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Pick one provider and add its key:
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Set which provider to use ("anthropic" or "openai"):
MODEL_PROVIDER=anthropic
```

```bash
# 4. Start the dev server
pnpm dev
```

The app will be running at **http://localhost:3000**.

## Available Scripts

| Command            | Description                         |
| ------------------ | ----------------------------------- |
| `pnpm dev`         | Start dev server on port 3000       |
| `pnpm build`       | Production build                    |
| `pnpm preview`     | Preview the production build        |
| `pnpm test`        | Run tests (Vitest)                  |
| `pnpm test:watch`  | Run tests in watch mode             |
| `pnpm lint`        | Lint and check formatting (Biome)   |
| `pnpm lint:fix`    | Auto-fix lint and formatting issues |

## Project Structure

```
src/
├── routes/
│   ├── index.tsx                        # Chat UI (main page + 12 tool renderers)
│   ├── __root.tsx                       # Root layout
│   └── api/
│       ├── chat.ts                      # POST /api/chat — streaming endpoint
│       ├── models.ts                    # GET /api/models — available models
│       └── conversations/
│           ├── index.ts                 # GET/POST /api/conversations
│           ├── $conversationId.ts       # GET/DELETE /api/conversations/:id
│           └── $conversationId.messages.ts  # POST messages
├── lib/
│   ├── chat-handler.ts                  # Socratic system prompt + streamText logic
│   ├── tools.ts                         # AI tool definitions (12 tools)
│   ├── model.ts                         # Model provider selection
│   ├── db.ts                            # Neon PostgreSQL connection
│   ├── cors.ts                          # CORS & CSRF protection
│   ├── rate-limit.ts                    # Sliding window rate limiter
│   └── logger.ts                        # Structured JSON logging
├── components/
│   ├── sidebar.tsx                      # Conversation history sidebar
│   └── DiagramPart.tsx                  # Mermaid → Excalidraw diagram renderer
├── styles.css                           # Global styles (Tailwind CSS v4)
└── router.tsx                           # TanStack Router config
```

## How It Works

1. The user types a message in the chat UI (`src/routes/index.tsx`).
2. `useChat` from `@ai-sdk/react` sends a POST request to `/api/chat`.
3. The API route validates the request (CSRF, rate limit, auth, input size), then calls `streamText` from the Vercel AI SDK with the Socratic system prompt and 12 tools.
4. The model responds with a mix of text and tool calls, streamed token-by-token.
5. Each tool call is rendered by a dedicated UI component (collapsible cards with structured data).
6. Conversations and messages are persisted to Neon PostgreSQL for history.

## Switching LLM Providers

Edit your `.env` file:

```env
# To use Anthropic (default):
MODEL_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-key

# To use OpenAI:
MODEL_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
```

Restart the dev server after changing environment variables.

## Deployment

The app is built on TanStack Start (Vite + Nitro), which supports multiple deployment targets. Run `pnpm build` to produce a production bundle, then deploy based on your platform:

### Vercel (recommended for simplicity)

Vercel has first-class support for Nitro-based apps.

1. Push your repo to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add your environment variables (`ANTHROPIC_API_KEY` or `OPENAI_API_KEY`, `MODEL_PROVIDER`) in the Vercel dashboard under **Settings > Environment Variables**.
4. Deploy — Vercel auto-detects the framework and handles the rest.

### Netlify

1. Push your repo to GitHub.
2. Import the project at [app.netlify.com](https://app.netlify.com/).
3. Set the build command to `pnpm build` and the publish directory to `dist`.
4. Add your environment variables in **Site settings > Environment variables**.
5. Deploy.

### Railway

1. Push your repo to GitHub.
2. Create a new project at [railway.app](https://railway.app/) and connect your repo.
3. Set environment variables in the Railway dashboard.
4. Railway will detect the start command and deploy automatically.

### Fly.io

1. Install the Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Run `fly launch` from the project root and follow the prompts.
3. Set secrets:
   ```bash
   fly secrets set ANTHROPIC_API_KEY=sk-ant-your-key MODEL_PROVIDER=anthropic
   ```
4. Deploy with `fly deploy`.

### Docker (self-hosted)

```dockerfile
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

```bash
docker build -t socrates .
docker run -p 3000:3000 \
  -e CLERK_PUBLISHABLE_KEY=pk_test_your_key \
  -e CLERK_SECRET_KEY=sk_test_your_key \
  -e MODEL_PROVIDER=anthropic \
  -e ANTHROPIC_API_KEY=sk-ant-your-key \
  socrates
```

> **Note:** The `.output` directory is the default Nitro output path. If your build output differs, check `.output/` after running `pnpm build`.

## Environment Variables Reference

| Variable            | Required | Default      | Description                                               |
| ------------------- | -------- | ------------ | --------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | Yes*     | —            | Your Anthropic API key                                    |
| `OPENAI_API_KEY`    | Yes*     | —            | Your OpenAI API key                                       |
| `MODEL_PROVIDER`    | No       | `anthropic`  | `"anthropic"` or `"openai"`                               |
| `DATABASE_URL`      | No       | —            | Neon PostgreSQL connection string (for conversation persistence) |
| `TAVILY_API_KEY`    | No       | —            | Tavily API key (for web search and resource discovery tools) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes  | —            | Clerk publishable key for the browser SDK                 |
| `CLERK_SECRET_KEY`  | Yes      | —            | Clerk secret key used by server middleware                |
| `ALLOWED_ORIGIN`    | No       | —            | Comma-separated CORS allowlist (e.g. `https://yourdomain.com`) |

\*Only the key for your chosen provider is required.

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19 + Vite + Nitro)
- **AI:** [Vercel AI SDK](https://sdk.vercel.ai/) with streaming and tool use
- **Models:** Anthropic Claude + OpenAI GPT via provider SDKs
- **Database:** [Neon](https://neon.tech/) serverless PostgreSQL
- **Diagrams:** [Excalidraw](https://excalidraw.com/) + Mermaid-to-Excalidraw converter
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Linting:** [Biome](https://biomejs.dev/)
- **Testing:** [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)

## License

MIT
