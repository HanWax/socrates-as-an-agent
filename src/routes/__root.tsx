import { ClerkProvider } from "@clerk/tanstack-react-start";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { clerkAppearance } from "../lib/clerk-theme";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Socrates as a Service" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <main
      id="main-content"
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        fontFamily: "sans-serif",
      }}
    >
      <section style={{ maxWidth: "40rem", textAlign: "center" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>404</p>
        <h1 style={{ margin: "0.5rem 0 0", fontSize: "1.75rem" }}>
          Page not found
        </h1>
        <p style={{ margin: "1rem 0 0" }}>
          The page you requested does not exist or was moved.
        </p>
        <p style={{ margin: "1.25rem 0 0" }}>
          <a href="/">Go back home</a>
        </p>
      </section>
    </main>
  ),
  errorComponent: ({ error }) => (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
    </div>
  ),
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <link rel="icon" type="image/svg+xml" href="/socrates.svg" />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-[#1a1a1a] focus:shadow"
        >
          Skip to main content
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ClerkProvider
      publishableKey={
        (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined) ??
        undefined
      }
      appearance={clerkAppearance}
    >
      <Outlet />
    </ClerkProvider>
  );
}
