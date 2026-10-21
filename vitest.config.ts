import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.tsx"],
    environment: "node",
    globalSetup: ["./tests/build.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "coverage",
    },
  },
})
