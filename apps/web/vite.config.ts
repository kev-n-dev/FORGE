import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "FORGE",
        short_name: "FORGE",
        description: "The professional network for people who make, build and create.",
        theme_color: "#111827",
        background_color: "#111827",
        display: "standalone",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Local app alias
      "@": path.resolve(__dirname, "./src"),
      // Workspace package aliases — resolve to source directly so Vite
      // can process them without a separate build step.
      // Only the packages the web bundle actually imports.
      // @forge/auth and @forge/database are server-side only — not aliased here.
      "@forge/types": path.resolve(root, "packages/types/src/index.ts"),
      "@forge/validation": path.resolve(root, "packages/validation/src/index.ts"),
      "@forge/config": path.resolve(root, "packages/config/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787", // Wrangler dev server
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["@tanstack/react-router"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
});
