import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["**/*.medium.test.ts"],
    testTimeout: 300000,
  },
});
