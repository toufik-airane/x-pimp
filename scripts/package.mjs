import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(resolve(projectDir, "manifest.json"), "utf8"));
const outputDir = resolve(projectDir, "dist");
const outputFile = resolve(outputDir, `x-pimp-${manifest.version}.zip`);
const files = [
  "manifest.json",
  "shared.js",
  "content.js",
  "pomodoro.js",
  "weather.js",
  "styles.css",
  "popup.html",
  "popup.js",
  "popup.css",
  "assets/icons/icon16.png",
  "assets/icons/icon32.png",
  "assets/icons/icon48.png",
  "assets/icons/icon128.png"
];

mkdirSync(outputDir, { recursive: true });
rmSync(outputFile, { force: true });
execFileSync("zip", ["-X", "-q", outputFile, ...files], { cwd: projectDir });
console.log(outputFile);
