import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import zip from "vite-plugin-zip-pack";
import manifest from "./manifest.config.js";
import { name, version } from "./package.json";

const browser = (process.env.BROWSER || "chrome") as "chrome" | "firefox";

export default defineConfig({
  resolve: {
    alias: {
      "@": `${path.resolve(__dirname, "src")}`,
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest, browser }),
    zip({ outDir: "release", outFileName: `crx-${name}-${version}.zip` }),
  ],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
