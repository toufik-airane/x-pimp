import { execFileSync } from "node:child_process";

const sourceFiles = [
  "shared.js",
  "background.js",
  "content.js",
  "hourly-bell.js",
  "pomodoro.js",
  "weather.js",
  "outline-label.js",
  "outline.js",
  "popup.js",
  "offscreen.js",
  "scripts/check.mjs",
  "scripts/capture-store-screenshot.mjs",
  "scripts/package.mjs",
  "scripts/test-background.mjs",
  "scripts/test-offscreen.mjs",
  "scripts/test-outline-label.mjs",
  "scripts/verify.mjs"
];

for (const file of sourceFiles) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

execFileSync(process.execPath, ["scripts/check.mjs"], { stdio: "inherit" });
execFileSync(process.execPath, ["scripts/test-background.mjs"], {
  stdio: "inherit"
});
execFileSync(process.execPath, ["scripts/test-offscreen.mjs"], {
  stdio: "inherit"
});
execFileSync(process.execPath, ["scripts/test-outline-label.mjs"], {
  stdio: "inherit"
});
console.log("x-pimp verification passed.");
