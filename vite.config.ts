import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const parsedDevtoolsPort = Number.parseInt(
  process.env.TANSTACK_DEVTOOLS_PORT ?? "",
  10,
);
const devtoolsPort = Number.isNaN(parsedDevtoolsPort)
  ? 42069
  : parsedDevtoolsPort;
const useSyncExternalStoreShimAlias = fileURLToPath(
  new URL("./src/shims/use-sync-external-store-shim.ts", import.meta.url),
);

const config = defineConfig({
  css: {
    devSourcemap: true,
  },
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: [
      {
        find: /^use-sync-external-store\/shim$/,
        replacement: useSyncExternalStoreShimAlias,
      },
      {
        find: /^use-sync-external-store\/shim\/index\.js$/,
        replacement: useSyncExternalStoreShimAlias,
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  plugins: [
    devtools({
      eventBusConfig: {
        port: devtoolsPort,
      },
    }),
    nitro({
      preset: "vercel",
      sourcemap: true,
      rollupConfig: { external: [/^@sentry\//] },
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});

export default config;
