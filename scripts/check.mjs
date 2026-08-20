import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
const styles = await readFile(new URL("styles.css", root), "utf8");
const backgroundImage = await readFile(
  new URL("assets/backgrounds/peaceful-plants.jpg", root)
);

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, "x-pimp");
assert.deepEqual(manifest.permissions, ["storage", "geolocation"]);
assert.equal(manifest.icons["128"], "assets/icons/icon128.png");
assert.ok(manifest.host_permissions.includes("https://api.open-meteo.com/*"));
assert.ok(
  manifest.web_accessible_resources.some((entry) =>
    entry.resources.includes("assets/backgrounds/peaceful-plants.jpg")
  )
);
assert.ok(manifest.content_scripts[0].matches.includes("https://x.com/*"));
assert.ok(manifest.content_scripts[0].js.includes("pomodoro.js"));
assert.ok(manifest.content_scripts[0].js.includes("weather.js"));
assert.ok(manifest.content_scripts[0].js.includes("outline.js"));
assert.deepEqual([...backgroundImage.subarray(0, 2)], [0xff, 0xd8]);
assert.ok(backgroundImage.length < 100_000);
assert.match(styles, /\[data-testid="sidebarColumn"\]/);
assert.match(styles, /display: none !important/);
assert.match(styles, /@keyframes x-pimp-shake/);
assert.match(styles, /article\[data-x-pimp-ad\]/);
assert.match(styles, /GrokDrawer/);
assert.match(styles, /chat-drawer-main/);
assert.match(styles, /justify-content: center !important/);
assert.match(styles, /--x-pimp-responsive-feed-width/);
assert.match(styles, /--x-pimp-gadget-width/);
assert.match(styles, /--x-pimp-peaceful-background/);
assert.match(styles, /background-attachment: fixed !important/);
assert.match(styles, /circle at 8% 26%/);
assert.match(styles, /circle at 92% 70%/);
assert.match(styles, /@media \(min-width: 600px\)/);
assert.doesNotMatch(styles, /max-width: 1099px/);
assert.match(styles, /#x-pimp-refresh/);
assert.match(styles, /#x-pimp-home/);
assert.match(styles, /#x-pimp-refresh::before/);
assert.match(styles, /width: 40px/);
assert.match(styles, /isolation: isolate/);
assert.match(styles, /background: rgb\(239 243 244 \/ 10%\)/);
assert.match(styles, /calc\(16px \+ var\(--x-pimp-gadget-width, 200px\) - 46px\)/);
assert.match(styles, /bottom: 24px/);
assert.match(styles, /calc\(100vw - 62px\)/);
assert.match(styles, /SideNav_AccountSwitcher_Button/);
assert.match(styles, /var\(--x-pimp-gadget-width, 200px\) - 55px/);
assert.match(styles, /transform: none !important/);
assert.match(styles, /max-width: 64px !important/);
assert.match(styles, /#x-pimp-home \{\s+top: 44px/);
assert.match(styles, /#x-pimp-pomodoro \{[\s\S]*top: 104px/);
assert.match(styles, /backdrop-filter: blur\(12px\)/);
assert.match(styles, /AppTabBar_Home_Link/);
assert.match(styles, /background: transparent/);
assert.match(styles, /margin-left: -88px !important/);
assert.match(styles, /header\[role="banner"\] nav\[aria-label="Primary"\]/);
assert.match(styles, /SideNav_NewTweet_Button/);

const content = await readFile(new URL("content.js", root), "utf8");
assert.match(content, /HOME_COOLDOWN_MS = 6000/);
assert.match(content, /assets\/backgrounds\/peaceful-plants\.jpg/);
assert.match(content, /chrome\.runtime\.getURL/);
assert.match(content, /AppTabBar_Home_Link/);
assert.match(content, /MutationObserver/);
assert.match(content, /AD_LABELS/);
assert.match(content, /REFRESH_BUTTON_ID/);
assert.match(content, /HOME_BUTTON_ID/);
assert.match(content, /createFloatingControl/);
assert.match(content, /REFRESH_COOLDOWN_KEY/);
assert.match(content, /chrome\.storage\.local\.set/);
assert.match(content, /homeLink\.click\(\)/);
assert.match(content, /handleKeyboardShortcut/);
assert.match(content, /isEditableTarget/);
assert.match(content, /event\.code === "KeyR"/);
assert.match(content, /event\.code === "KeyP"/);
assert.match(content, /Digit1: 15/);
assert.match(content, /POMODORO_DURATION_BY_CODE/);
assert.match(content, /window\.addEventListener\("keydown"/);
assert.doesNotMatch(content, /location\.reload\(\)/);
assert.doesNotMatch(content, /Home unlocks|cooldown-toast/);
assert.doesNotMatch(styles, /cooldown-toast/);

const shared = await readFile(new URL("shared.js", root), "utf8");
const context = vm.createContext({ globalThis: {} });
vm.runInContext(shared, context);

let now = 1000;
const cooldown = context.globalThis.X_PIMP.createCooldown(6000, () => now);
assert.equal(cooldown.attempt().allowed, true);
now = 2000;
assert.deepEqual(
  { ...cooldown.attempt() },
  { allowed: false, remainingMs: 5000 }
);
now = 6999;
assert.equal(cooldown.attempt().allowed, false);
now = 7000;
assert.equal(cooldown.attempt().allowed, true);

const { sanitize } = context.globalThis.X_PIMP;
assert.equal(sanitize({ feedWidth: 847 }).feedWidth, 840);
assert.equal(sanitize({ feedWidth: 200 }).feedWidth, 560);
assert.equal(sanitize({ feedWidth: 2000 }).feedWidth, 900);
assert.equal(sanitize({ feedWidth: "wide" }).feedWidth, 720);

const popup = await readFile(new URL("popup.html", root), "utf8");
assert.match(popup, /id="feed-width"/);
assert.match(styles, /--x-pimp-feed-width/);

const pomodoro = await readFile(new URL("pomodoro.js", root), "utf8");
assert.match(pomodoro, /new Set\(\[15, 30, 45\]\)/);
assert.match(pomodoro, /chrome\.storage\.local/);
assert.match(pomodoro, /x-pimp-pomodoro/);
assert.match(pomodoro, /x-pimp-clock-time/);
assert.match(pomodoro, /Intl\.DateTimeFormat/);
assert.match(pomodoro, /CLOCK_FORMATTER/);
assert.match(pomodoro, /bootObserver\.disconnect/);
assert.doesNotMatch(pomodoro, /new MutationObserver\(ensureWidget\)/);
assert.match(pomodoro, /aria-keyshortcuts="Alt\+P"/);
assert.match(pomodoro, /⌥R refresh/);
assert.match(
  pomodoro,
  /x-pimp-pomodoro-actions">[\s\S]*x-pimp-pomodoro-reset[\s\S]*x-pimp-pomodoro-toggle/
);
assert.match(styles, /#x-pimp-pomodoro/);
assert.match(styles, /box-sizing: border-box/);
assert.match(styles, /opacity: 0\.72/);

const weather = await readFile(new URL("weather.js", root), "utf8");
assert.match(weather, /navigator\.geolocation/);
assert.match(weather, /api\.open-meteo\.com/);
assert.match(weather, /toFixed\(2\)/);
assert.match(weather, /x-pimp-weather/);
assert.match(weather, /Share approximate location/);
assert.match(weather, /x-pimp-weather-disable/);
assert.match(weather, /chrome\.storage\.local\.remove/);
assert.match(weather, /WIDGET_GAP_PX = 14/);
assert.match(weather, /ResizeObserver/);
assert.match(weather, /getBoundingClientRect\(\)\.bottom/);
assert.match(weather, /window\.clearInterval\(weatherTimer\)/);
assert.doesNotMatch(weather, /new MutationObserver\(ensureWidget\)/);
assert.doesNotMatch(weather, /weatherState\.(latitude|longitude)/);
assert.match(styles, /#x-pimp-weather/);

const outline = await readFile(new URL("outline.js", root), "utf8");
assert.match(outline, /x-pimp-outline/);
assert.match(outline, /window\.scrollTo/);
assert.match(outline, /data-x-pimp-ad/);
assert.match(outline, /prefers-reduced-motion/);
assert.match(outline, /MAX_LABEL_WORDS = 5/);
assert.match(outline, /TOP_READING_OFFSET_PX = 96/);
assert.match(outline, /DISCONNECTED_GRACE_MS = 2000/);
assert.match(outline, /tweetText/);
assert.match(outline, /entriesByKey/);
assert.match(outline, /lastKnownTop/);
assert.doesNotMatch(outline, /block: "center"/);
assert.match(outline, /getArticleKey/);
assert.match(outline, /dataset\.disconnected/);
assert.doesNotMatch(outline, /keepActiveVisible|track\.scrollTop\s*=/);
assert.match(outline, /x-pimp-outline-current/);
assert.match(outline, /navigateToEntry/);
assert.match(outline, /entryIsVisible/);
assert.match(outline, /String\(currentEntries\.length\)/);
assert.doesNotMatch(outline, /trackedTweets\.delete/);
assert.doesNotMatch(outline, /chrome\.storage|fetch\(/);
assert.match(styles, /#x-pimp-outline \{[\s\S]*top: 44px/);
assert.match(styles, /calc\(100vw - 156px\)/);
assert.match(styles, /\.x-pimp-outline-track::before \{[\s\S]*left: 5px/);
assert.match(styles, /\.x-pimp-outline-anchor/);
assert.match(styles, /\.x-pimp-outline-label/);
assert.match(styles, /font: 600 11px\/1\.25/);
assert.match(styles, /flex-direction: row/);
assert.match(styles, /justify-content: flex-start/);
assert.match(styles, /text-align: left/);
assert.match(styles, /--x-pimp-outline-count/);
assert.match(styles, /max-height: 50vh/);
assert.match(styles, /data-disconnected="true"/);
assert.match(styles, /data-disconnected="true"\] \{\s+display: none/);
assert.match(styles, /\.x-pimp-outline-current/);
assert.doesNotMatch(outline, /batchStart/);
assert.doesNotMatch(styles, /data-batch-start/);

console.log("x-pimp checks passed.");
