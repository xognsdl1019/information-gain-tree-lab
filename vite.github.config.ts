import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  root: "static-site",
  base: "/information-gain-tree-lab/",
  plugins: [react()],
  build: {
    outDir: "../github-pages-dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "static-site/index.html"),
        scatter: resolve(import.meta.dirname, "static-site/scatter/index.html"),
      },
    },
  },
});
