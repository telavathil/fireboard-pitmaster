import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// Pin the zone before test workers start so time formatting and server-time
// parsing (zoneless timestamps are read as UTC) are deterministic on any machine.
process.env.TZ = "UTC";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    pool: "threads",
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
