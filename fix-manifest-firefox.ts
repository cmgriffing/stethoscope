import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const manifestPath = "dist/manifest.json";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const assetsPath = "dist/assets";

const assets = readdirSync(assetsPath);

let backgroundFile = "";
for (const asset of assets) {
  if (asset.startsWith("background")) {
    backgroundFile = `assets/${asset}`;
    break;
  }
}

manifest.background = {
  scripts: [backgroundFile],
  type: "module",
};

manifest.browser_specific_settings = {
  gecko: {
    id: "{816b9ac2-08db-4a8a-9ffe-a95563c78736}",
  },
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
