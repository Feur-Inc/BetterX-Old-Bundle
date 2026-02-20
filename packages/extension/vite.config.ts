import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import manifest from "./src/manifest.json";

export default defineConfig({
  resolve: {
    alias: {
      "@betterx/core": resolve(__dirname, "../core/src/index.ts"),
      "@betterx/plugins": resolve(__dirname, "../plugins/src/index.ts"),
    },
  },
  plugins: [
    crx({ manifest }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
