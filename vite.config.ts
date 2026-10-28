import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: "production-csp",
      transformIndexHtml(html) {
        return command === "build"
          ? html.replace("connect-src 'self' ws:", "connect-src 'self'")
          : html;
      },
    },
  ],
  base: process.env.APP_BASE || "/",
  build: { outDir: process.env.APP_OUT_DIR || "dist" },
}));
