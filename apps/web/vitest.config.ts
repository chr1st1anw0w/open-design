import { defineConfig } from "vitest/config";

// Stub for browser-only third-party UI packages that don't load cleanly in the
// Node-based vitest collector (CSS imports, directory-style ESM, etc.). Tests
// that actually render these components should provide their own targeted
// mocks; this module just keeps suite collection from crashing.
const BROWSER_UI_STUB = "export const C1Chat = () => null; export default {};";

export default defineConfig({
  plugins: [
    // Stub `.css` imports so transitively pulling in third-party packages
    // (e.g. `@thesysai/genui-sdk` imports `genui-sdk.css`) doesn't crash the
    // Node-based test runner with `Unknown file extension ".css"`.
    {
      name: "open-design-test-stub-css",
      enforce: "pre",
      resolveId(id) {
        if (id.endsWith(".css")) return id;
        return null;
      },
      load(id) {
        if (id.endsWith(".css")) return "export default {};";
        return null;
      },
    },
    // Stub `@thesysai/genui-sdk` so we don't have to resolve its full tree of
    // browser-only UI dependencies (Crayon, CSS, etc.) just to type-check
    // helper functions in `src/App.tsx`.
    {
      name: "open-design-test-stub-genui-sdk",
      enforce: "pre",
      resolveId(id) {
        if (id === "@thesysai/genui-sdk") {
          return "\0open-design-stub:genui-sdk";
        }
        return null;
      },
      load(id) {
        if (id === "\0open-design-stub:genui-sdk") return BROWSER_UI_STUB;
        return null;
      },
    },
  ],
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
