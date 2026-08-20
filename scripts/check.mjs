import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
const styles = await readFile(new URL("styles.css", root), "utf8");

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, "x-pimp");
assert.deepEqual(manifest.permissions, ["storage", "geolocation"]);
assert.equal(manifest.icons["128"], "assets/icons/icon128.png");
assert.ok(manifest.host_permissions.includes("https://api.open-meteo.com/*"));
assert.ok(manifest.content_scripts[0].matches.includes("https://x.com/*"));
assert.ok(manifest.content_scripts[0].js.includes("pomodoro.js"));
assert.ok(manifest.content_scripts[0].js.includes("weather.js"));
assert.match(styles, /\[data-testid="sidebarColumn"\]/);
assert.match(styles, /display: none !important/);
assert.match(styles, /@keyframes x-pimp-shake/);
assert.match(styles, /article\[data-x-pimp-ad\]/);
assert.match(styles, /GrokDrawer/);
assert.match(styles, /chat-drawer-main/);
assert.match(styles, /justify-content: center !important/);
assert.match(styles, /--x-pimp-responsive-feed-width/);
assert.match(styles, /--x-pimp-gadget-width/);
assert.doesNotMatch(styles, /max-width: 1099px/);
assert.match(styles, /#x-pimp-refresh/);
assert.match(styles, /AppTabBar_Home_Link/);
assert.match(styles, /background: transparent/);
assert.match(styles, /margin-left: -88px !important/);
assert.match(styles, /header\[role="banner"\] nav\[aria-label="Primary"\]/);
assert.match(styles, /SideNav_NewTweet_Button/);

const content = await readFile(new URL("content.js", root), "utf8");
assert.match(content, /HOME_COOLDOWN_MS = 6000/);
assert.match(content, /AppTabBar_Home_Link/);
assert.match(content, /MutationObserver/);
assert.match(content, /AD_LABELS/);
assert.match(content, /REFRESH_BUTTON_ID/);
assert.match(content, /REFRESH_COOLDOWN_KEY/);
assert.match(content, /chrome\.storage\.local\.set/);
assert.match(content, /homeLink\.click\(\)/);
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
assert.doesNotMatch(weather, /weatherState\.(latitude|longitude)/);
assert.match(styles, /#x-pimp-weather/);

console.log("x-pimp checks passed.");
