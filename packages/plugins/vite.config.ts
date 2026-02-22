import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@betterx/core": resolve(__dirname, "../core/src/index.ts"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "BetterXPlugins",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["@betterx/core", "codemirror"],
    },
  },
});
