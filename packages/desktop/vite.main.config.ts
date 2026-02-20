import { defineConfig, type UserConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/main/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    outDir: "dist/main",
    emptyOutDir: true,
    rollupOptions: {
      // Externalize everything except local files and @betterx workspace packages
      external: (id: string) =>
        !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("@betterx/"),
    },
  },
  resolve: {
    alias: {
      "@betterx/core": resolve(__dirname, "../core/src/index.ts"),
    },
  },
} as UserConfig);
