import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
const styles = await readFile(new URL("styles.css", root), "utf8");
const backgroundImage = await readFile(
  new URL("assets/backgrounds/peaceful-plants.jpg", root)
);
const bellAudio = await readFile(new URL("assets/audio/hourly-bell.mp3", root));
const storeDescription = await readFile(
  new URL("store-assets/DESCRIPTION.txt", root),
  "utf8"
);
const privacyPolicy = await readFile(new URL("PRIVACY.md", root), "utf8");
const website = await readFile(new URL("docs/index.html", root), "utf8");
const websiteIcon = await readFile(new URL("docs/icon.svg", root), "utf8");

async function assertPngDimensions(path, width, height) {
  const image = await readFile(new URL(path, root));
  assert.deepEqual([...image.subarray(1, 4)], [0x50, 0x4e, 0x47]);
  assert.equal(image.readUInt32BE(16), width, `${path} width`);
  assert.equal(image.readUInt32BE(20), height, `${path} height`);
}

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, "x-pimp");
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.deepEqual(manifest.permissions, [
  "storage",
  "geolocation",
  "alarms",
  "offscreen"
]);
assert.equal(manifest.minimum_chrome_version, "116");
assert.equal(manifest.background.service_worker, "background.js");
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
assert.ok(manifest.content_scripts[0].js.includes("outline-label.js"));
assert.ok(manifest.content_scripts[0].js.includes("outline.js"));
assert.ok(manifest.content_scripts[0].js.includes("hourly-bell.js"));
assert.deepEqual([...backgroundImage.subarray(0, 2)], [0xff, 0xd8]);
assert.ok(backgroundImage.length < 100_000);
assert.equal(bellAudio[0], 0xff);
assert.ok(bellAudio.length < 1_100_000);
await assertPngDimensions("assets/icons/icon16.png", 16, 16);
await assertPngDimensions("assets/icons/icon32.png", 32, 32);
await assertPngDimensions("assets/icons/icon48.png", 48, 48);
await assertPngDimensions("assets/icons/icon128.png", 128, 128);
await assertPngDimensions("store-assets/screenshot-1.png", 1280, 800);
await assertPngDimensions("store-assets/small-promo.png", 440, 280);
await assertPngDimensions("store-assets/marquee-promo.png", 1400, 560);
assert.doesNotMatch(storeDescription, /(^|\n)\s{0,3}#{1,6}\s/m);
assert.doesNotMatch(storeDescription, /\*\*|__|```|\[[^\]]+\]\([^)]+\)/);
assert.match(storeDescription, /calmer and easier to focus/);
assert.match(website, new RegExp(`Chrome extension · v${manifest.version}`));
assert.match(website, /nonemmfagigefdfmgebidhnebidanedg/);
assert.match(website, /href="icon\.svg"/);
assert.match(websiteIcon, /mint calathea leaf/);
assert.match(website, /visible article titles/);
assert.match(privacyPolicy, /visible article titles/);
assert.match(styles, /\[data-testid="sidebarColumn"\]/);
assert.match(styles, /display: none !important/);
assert.match(styles, /@keyframes x-pimp-shake/);
assert.match(styles, /article\[data-x-pimp-ad\]/);
assert.match(styles, /GrokDrawer/);
assert.match(styles, /chat-drawer-main/);
assert.match(styles, /justify-content: center !important/);
assert.match(styles, /--x-pimp-responsive-feed-width/);
assert.match(styles, /--x-pimp-gadget-width/);
assert.match(styles, /--x-pimp-gadget-left/);
assert.match(styles, /--x-pimp-peaceful-background/);
assert.match(styles, /background-attachment: fixed !important/);
assert.match(styles, /circle at 8% 26%/);
assert.match(styles, /circle at 92% 70%/);
assert.match(styles, /data-x-pimp-media-viewer="true"/);
assert.match(styles, /data-x-pimp-ui-ready="true"/);
assert.match(styles, /visibility: hidden !important/);
assert.match(styles, /background-image: none !important/);
assert.match(
  styles,
  /data-x-pimp-media-viewer="true"\] #x-pimp-pomodoro[\s\S]*#x-pimp-weather/
);
assert.match(styles, /@media \(min-width: 600px\)/);
assert.doesNotMatch(styles, /max-width: 1099px/);
assert.match(styles, /#x-pimp-refresh/);
assert.match(styles, /#x-pimp-home/);
assert.match(styles, /#x-pimp-sound/);
assert.match(styles, /var\(--x-pimp-gadget-width, 200px\) - 98px/);
assert.match(styles, /rgb\(73 108 137\)/);
assert.match(styles, /#x-pimp-refresh::before/);
assert.match(styles, /width: 40px/);
assert.match(styles, /isolation: isolate/);
assert.match(styles, /background: rgb\(239 243 244 \/ 10%\)/);
assert.match(
  styles,
  /var\(--x-pimp-gadget-left, 16px\)[\s\S]*var\(--x-pimp-gadget-width, 200px\) - 46px/
);
assert.match(styles, /bottom: 24px/);
assert.match(styles, /calc\(100vw - 62px\)/);
assert.match(styles, /SideNav_AccountSwitcher_Button/);
assert.match(
  styles,
  /SideNav_AccountSwitcher_Button"\]\s*> :not\(:has\(\[data-testid\*="UserAvatar"\]\)\)/
);
assert.match(
  styles,
  /var\(--x-pimp-gadget-left, 16px\)[\s\S]*var\(--x-pimp-gadget-width, 200px\) - 55px/
);
assert.match(styles, /transform: none !important/);
assert.match(styles, /max-width: 64px !important/);
assert.match(styles, /#x-pimp-home \{\s+top: 44px/);
assert.match(
  styles,
  /#x-pimp-sound \{[\s\S]*var\(--x-pimp-gadget-left, 16px\)[\s\S]*var\(--x-pimp-gadget-width, 200px\) - 98px/
);
assert.match(styles, /#x-pimp-pomodoro \{[\s\S]*top: 104px/);
assert.match(
  styles,
  /#x-pimp-pomodoro \{[\s\S]*left: var\(--x-pimp-gadget-left, 16px\)/
);
assert.match(
  styles,
  /#x-pimp-weather \{[\s\S]*left: var\(--x-pimp-gadget-left, 16px\)/
);
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
assert.match(content, /MEDIA_VIEWER_PATH_PATTERN/);
assert.match(content, /MEDIA_VIEWER_SELECTOR/);
assert.match(content, /dataset\.xPimpMediaViewer/);
assert.match(content, /updateMediaViewerState\(\);\s+ensureInterfaceControls/);
assert.match(content, /AppTabBar_Home_Link/);
assert.match(content, /MutationObserver/);
assert.match(content, /AD_LABELS/);
assert.match(content, /REFRESH_BUTTON_ID/);
assert.match(content, /HOME_BUTTON_ID/);
assert.match(content, /createFloatingControl/);
assert.match(content, /REFRESH_COOLDOWN_KEY/);
assert.match(content, /CORE_INTERFACE_SELECTORS/);
assert.match(content, /UI_REVEAL_FALLBACK_MS = 1000/);
assert.match(content, /scheduleInterfaceReveal/);
assert.match(content, /dataset\.xPimpUiReady = "true"/);
assert.match(content, /setInterval\(scheduleInterfaceReveal, 25\)/);
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
const outlineLabels = await readFile(
  new URL("outline-label.js", root),
  "utf8"
);
assert.match(outline, /x-pimp-outline/);
assert.match(outline, /window\.scrollTo/);
assert.match(outline, /data-x-pimp-ad/);
assert.match(outline, /prefers-reduced-motion/);
assert.match(outlineLabels, /MAX_LABEL_WORDS = 5/);
assert.match(outline, /TOP_READING_OFFSET_PX = 96/);
assert.match(outline, /DISCONNECTED_GRACE_MS = 2000/);
assert.match(outlineLabels, /tweetText/);
assert.match(outlineLabels, /twitterArticleReadView/);
assert.match(outlineLabels, /card\.layoutLarge\.media/);
assert.match(outlineLabels, /articleTitle/);
assert.match(outlineLabels, /getArticleTitle/);
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
assert.doesNotMatch(`${outline}\n${outlineLabels}`, /chrome\.storage|fetch\(/);
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

const background = await readFile(new URL("background.js", root), "utf8");
assert.match(background, /x-pimp-hourly-bell/);
assert.match(background, /x-pimp-stop-hourly-bell/);
assert.match(background, /periodInMinutes: 60/);
assert.match(background, /getNextHour/);
assert.match(background, /chrome\.offscreen\s+\.createDocument/);
assert.match(background, /AUDIO_PLAYBACK/);
assert.match(background, /chrome\.runtime\.getContexts/);
assert.match(background, /getOffscreenContexts/);
assert.match(background, /result\[ENABLED_KEY\] === true/);

const hourlyBell = await readFile(new URL("hourly-bell.js", root), "utf8");
assert.match(hourlyBell, /x-pimp-sound/);
assert.match(hourlyBell, /hourlyBellEnabled/);
assert.match(hourlyBell, /aria-pressed/);
assert.match(hourlyBell, /x-pimp-preview-hourly-bell/);
assert.match(hourlyBell, /result\[ENABLED_KEY\] === true/);

const offscreen = await readFile(new URL("offscreen.js", root), "utf8");
assert.match(offscreen, /assets\/audio\/hourly-bell\.mp3/);
assert.match(offscreen, /audio\.currentTime = 0/);
assert.match(offscreen, /audio\.play\(\)/);
assert.match(offscreen, /STOP_MESSAGE/);
assert.match(offscreen, /hourlyBellEnabled/);
assert.match(offscreen, /chrome\.storage\.local\.get/);
assert.match(offscreen, /chrome\.storage\.onChanged/);
assert.match(offscreen, /soundStateRevision/);

const packageScript = await readFile(
  new URL("scripts/package.mjs", root),
  "utf8"
);
assert.match(packageScript, /"README\.md"/);

const releaseWorkflow = await readFile(
  new URL(".github/workflows/release.yml", root),
  "utf8"
);
assert.match(releaseWorkflow, /actions\/checkout@[a-f0-9]{40}/);
assert.match(releaseWorkflow, /actions\/setup-node@[a-f0-9]{40}/);
assert.doesNotMatch(releaseWorkflow, /uses: [^\n]+@v\d/);
assert.match(releaseWorkflow, /fetch-depth: 0/);
assert.match(releaseWorkflow, /semgrep==1\.174\.0/);
assert.match(releaseWorkflow, /\.verification\.verified/);
assert.match(releaseWorkflow, /gh release create/);

console.log("x-pimp checks passed.");
