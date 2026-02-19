# Socrates

A Socratic method chatbot that challenges your thinking through probing questions — never giving direct answers, only helping you discover what you think and whether it holds up to scrutiny.

## What It Does

Socrates plays three interconnected roles depending on the conversation:

- **Philosophical guide** — examines beliefs, arguments, and reasoning through the Socratic method
- **Business idea soundboard** — stress-tests entrepreneurial ideas, unit economics, and competitive moats
- **Moral ambition coach** — excavates genuine values and pushes toward specificity and commitment

Every conversation moves through three phases: **Explore** (surface assumptions), **Build** (construct and test arguments), and **Refine** (synthesize and deepen understanding). Socrates never lectures — it asks questions that lead you to your own conclusions.

## Tools

Socrates has access to 8 tools it can invoke during conversation:

| Tool | Purpose |
|------|---------|
| **Web Search** | Searches the web via Tavily for real-world evidence and counterexamples |
| **Argument Map** | Structures logical arguments: claim, premises, evidence, counterarguments |
| **Suggest Reading** | Curated book/article/paper/video recommendations with difficulty levels |
| **Discover Resources** | Finds recently published content (articles, podcasts, essays) via Tavily |
| **Draw Diagram** | Renders Mermaid diagrams (flowchart, sequence, class) via Excalidraw |
| **Retrieval Practice** | Structured recall challenges with assessment and corrective feedback |
| **Progressive Disclosure** | Multi-layered explanations from simple to complex with "go deeper" interaction |
| **Save Insight** | Persists breakthrough moments to the database for later reference |

Each tool renders as a dedicated, collapsible UI component in the chat.

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19, Vite, Nitro)
- **AI:** [Vercel AI SDK](https://sdk.vercel.ai/) with streaming and tool use
- **Models:** Anthropic (Claude Sonnet 4.5, Haiku 3.5) and OpenAI (GPT-4o, GPT-4o Mini)
- **Auth:** [Clerk](https://clerk.com/)
- **Database:** [Neon](https://neon.tech/) serverless PostgreSQL
- **Diagrams:** [Excalidraw](https://excalidraw.com/) + Mermaid-to-Excalidraw converter
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with a Miro-inspired color palette
- **Linting:** [Biome](https://biomejs.dev/)
- **Testing:** [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/socrates.git
cd socrates
pnpm install
cp .env.example .env
```

Fill in your `.env`:

```env
# Auth (required)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# At least one LLM provider (required)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Conversation persistence
DATABASE_URL=postgres://...

# Web search + resource discovery
TAVILY_API_KEY=tvly-...
```

```bash
pnpm dev
```

Open **http://localhost:3000**.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (browser) |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (server) |
| `ANTHROPIC_API_KEY` | Yes* | Anthropic API key |
| `OPENAI_API_KEY` | Yes* | OpenAI API key |
| `DATABASE_URL` | No | Neon PostgreSQL connection string |
| `TAVILY_API_KEY` | No | Enables web search and resource discovery tools |
| `ALLOWED_ORIGIN` | No | Comma-separated CORS allowlist |

*At least one LLM provider key is required. Available models are filtered by which keys are configured.

## Project Structure

```
src/
├── routes/
│   ├── index.tsx                  # Chat UI + tool renderers
│   ├── __root.tsx                 # Root layout with ClerkProvider
│   ├── sign-in.$.tsx              # Sign-in page
│   ├── sign-up.$.tsx              # Sign-up page
│   └── api/
│       ├── chat.ts                # POST /api/chat (streaming)
│       ├── models.ts              # GET /api/models
│       └── conversations/
│           ├── index.ts           # GET/POST conversations
│           ├── $conversationId.ts # GET/DELETE conversation
│           └── $conversationId/
│               └── messages.ts    # POST save message
├── lib/
│   ├── chat-handler.ts            # System prompt + streamText orchestration
│   ├── tools.ts                   # 8 AI tool definitions (Zod schemas)
│   ├── model.ts                   # Multi-model provider selection
│   ├── db.ts                      # Neon database connection
│   ├── auth.ts                    # Clerk auth check
│   ├── cors.ts                    # CORS/CSRF protection
│   ├── rate-limit.ts              # Sliding window rate limiter
│   ├── message-validation.ts      # Input validation (size, types, counts)
│   ├── clerk-theme.ts             # Miro-inspired Clerk UI theme
│   └── logger.ts                  # Structured JSON logging
├── components/
│   ├── sidebar.tsx                # Conversation history (grouped by day)
│   ├── DiagramPart.tsx            # Mermaid → Excalidraw renderer
│   └── ConfirmDialog.tsx          # Confirmation modal
├── styles.css                     # Tailwind v4 + custom theme
└── router.tsx                     # TanStack Router config
```

## How It Works

1. User types a message in the chat UI.
2. `useChat` from `@ai-sdk/react` POSTs to `/api/chat`.
3. The server validates the request (CSRF, rate limit, auth, input size), then calls `streamText` with the Socratic system prompt and tools.
4. The model responds with text and tool calls, streamed token-by-token.
5. Tool results render as collapsible cards with structured data.
6. Conversations and messages persist to Neon PostgreSQL.

## Security

- **CSRF protection** — origin header validation with configurable allowlist
- **Rate limiting** — sliding window: 20 req/min per IP, 60 req/min per user
- **Authentication** — Clerk session required for all routes and API endpoints
- **Input validation** — max 100 messages, 10K chars/message, 4 images/message, 5 MB/file, 5 MB total body

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Tests in watch mode |
| `pnpm lint` | Lint + format check (Biome) |
| `pnpm lint:fix` | Auto-fix lint + formatting |

## License

MIT
