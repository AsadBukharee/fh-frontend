import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Vitest uses Vite's resolver. Next.js projects often import files directly from
  // the `public/` folder; Vite treats `public/` specially, which can break module
  // resolution in tests. Disabling Vite's publicDir handling makes imports work.
  publicDir: false,
  resolve: {
    alias: [
      // Match the project's TS path alias: "@/..." => "<repoRoot>/..."
      { find: "@", replacement: path.resolve(__dirname) },

      // Stub styles/assets for jsdom tests.
      { find: /\.(css|scss)$/i, replacement: path.resolve(__dirname, "tests/mocks/styleMock.ts") },
      { find: /\.(png|jpe?g|gif|webp|svg|ico|mp3)$/i, replacement: path.resolve(__dirname, "tests/mocks/fileMock.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setup/vitest.setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    // Keep tests deterministic and fast.
    clearMocks: true,
    restoreMocks: true,
    hookTimeout: 30000,
    testTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["app/**/*.ts", "app/**/*.tsx", "components/**/*.ts", "components/**/*.tsx", "lib/**/*.ts", "lib/**/*.tsx"],
      exclude: ["tests/**", "node_modules/**", "app/**/route.tsx"],
    },
  },
});

