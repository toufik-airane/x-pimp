import { execFileSync, spawnSync } from "node:child_process";

const retiredBrandScan = spawnSync(
  "git",
  ["grep", "-I", "-n", "-i", "-E", "x[-_ ]?pimp", "--", "."],
  { encoding: "utf8" }
);
if (retiredBrandScan.status === 0) {
  throw new Error(
    `Retired brand reference found:\n${retiredBrandScan.stdout.trim()}`
  );
}
if (retiredBrandScan.status !== 1) {
  throw new Error(
    `Could not scan for retired brand references:\n${retiredBrandScan.stderr.trim()}`
  );
}

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
  "scripts/test-content.mjs",
  "scripts/test-offscreen.mjs",
  "scripts/test-outline-label.mjs",
  "scripts/test-weather.mjs",
  "scripts/verify.mjs"
];

for (const file of sourceFiles) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

execFileSync(process.execPath, ["scripts/check.mjs"], { stdio: "inherit" });
execFileSync(process.execPath, ["scripts/test-background.mjs"], {
  stdio: "inherit"
});
execFileSync(process.execPath, ["scripts/test-content.mjs"], {
  stdio: "inherit"
});
execFileSync(process.execPath, ["scripts/test-offscreen.mjs"], {
  stdio: "inherit"
});
execFileSync(process.execPath, ["scripts/test-outline-label.mjs"], {
  stdio: "inherit"
});
execFileSync(process.execPath, ["scripts/test-weather.mjs"], {
  stdio: "inherit"
});
console.log("x-zen verification passed.");
