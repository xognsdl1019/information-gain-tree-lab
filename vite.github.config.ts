import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ root: "static-site", base: "/information-gain-tree-lab/", plugins: [react()], build: { outDir: "../github-pages-dist", emptyOutDir: true } });
