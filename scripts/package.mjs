import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(resolve(projectDir, "manifest.json"), "utf8"));
const outputDir = resolve(projectDir, "dist");
const outputFile = resolve(outputDir, `x-pimp-${manifest.version}.zip`);
const files = [
  "README.md",
  "manifest.json",
  "shared.js",
  "background.js",
  "content.js",
  "hourly-bell.js",
  "pomodoro.js",
  "weather.js",
  "outline.js",
  "styles.css",
  "popup.html",
  "popup.js",
  "popup.css",
  "offscreen.html",
  "offscreen.js",
  "THIRD_PARTY_NOTICES.md",
  "assets/icons/icon16.png",
  "assets/icons/icon32.png",
  "assets/icons/icon48.png",
  "assets/icons/icon128.png",
  "assets/backgrounds/peaceful-plants.jpg",
  "assets/audio/hourly-bell.mp3"
];

mkdirSync(outputDir, { recursive: true });
rmSync(outputFile, { force: true });
execFileSync("zip", ["-X", "-q", outputFile, ...files], { cwd: projectDir });
console.log(outputFile);
