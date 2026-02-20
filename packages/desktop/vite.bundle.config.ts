// Builds the injected bundle (BetterX content script for Electron)
import { defineConfig, type UserConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/renderer/bundle-entry.ts"),
      formats: ["iife"],
      name: "BetterXBundle",
      fileName: "bundle",
    },
    outDir: "dist/bundle",
    emptyOutDir: true,
    rollupOptions: {
      // All deps bundled into the IIFE
      external: [],
    },
  },
  resolve: {
    alias: {
      "@betterx/core": resolve(__dirname, "../core/src/index.ts"),
      "@betterx/plugins": resolve(__dirname, "../plugins/src/index.ts"),
    },
  },
} as UserConfig);
