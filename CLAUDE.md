# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build
pnpm test         # Run tests (vitest run)
pnpm test:watch   # Run tests in watch mode
pnpm lint         # Lint and check formatting (Biome)
pnpm lint:fix     # Auto-fix lint issues and format
pnpm format       # Format all files (Biome)
pnpm preview      # Preview production build
```

**Linting & formatting**: Biome is configured in `biome.json` with recommended rules, 2-space indentation, and Tailwind CSS directive support. TypeScript strict mode is enabled with `noUnusedLocals` and `noUnusedParameters`.

## Environment Variables

Copy `.env.example` to `.env`. Requires `ANTHROPIC_API_KEY` (default) or `OPENAI_API_KEY`. Set `MODEL_PROVIDER` to `"anthropic"` or `"openai"`.

## Architecture

This is a Socratic method chatbot — a single-page streaming chat app.

**Framework**: TanStack Start with file-based routing, built on Vite + Nitro. Routes live in `src/routes/` and the route tree is auto-generated in `src/routeTree.gen.ts` (do not edit manually).

**Request flow**: The chat UI (`src/routes/index.tsx`) uses `useChat` from `@ai-sdk/react` which POSTs to `/api/chat`. The API route (`src/routes/api/chat.ts`) calls `streamText` from the Vercel AI SDK with a Socratic method system prompt and returns a streaming response via `toUIMessageStreamResponse()`.

**Model selection**: `src/lib/model.ts` reads `MODEL_PROVIDER` env var and returns either `anthropic('claude-sonnet-4-5-20250929')` or `openai('gpt-4o')`.

**Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Global styles in `src/styles.css`. The app uses a custom color palette with hex values (not Tailwind theme tokens).

**Path aliases**: `@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`).

## Code Style

**Conditional rendering**: Never use `&&` for conditional rendering in React. Always use ternaries (`condition ? <Component /> : null`).
