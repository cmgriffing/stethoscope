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
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
