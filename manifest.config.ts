import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

const browser = (process.env.BROWSER || "chrome") as "chrome" | "firefox";

const config = {
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: "public/stethoscope_48.png",
    128: "public/stethoscope_128.png",
  },
  action: {
    default_icon: {
      48: "public/stethoscope_48.png",
      128: "public/stethoscope_128.png",
    },
    default_popup: "src/popup/index.html",
  },
  permissions: ["tabs"],
  content_scripts: [
    {
      js: ["src/content/main.ts"],
      matches: ["https://github.com/*"],
    },
  ],
  background: {
    service_worker: "src/background.ts",
    type: "module",
  },
} as any;

if (browser === "firefox") {
  config.background = {
    scripts: ["src/background.ts"],
  };
}

export default defineManifest(config);
