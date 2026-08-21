import { writeFile } from "node:fs/promises";

const DEBUG_ENDPOINT = "http://127.0.0.1:9222/json/list";
const OUTPUT_PATH = new URL("../store-assets/screenshot-1.png", import.meta.url);

// Chrome DevTools exposes this development-only API on the loopback interface.
const targets = await fetch(DEBUG_ENDPOINT).then((response) => { // nosemgrep: typescript.react.security.react-insecure-request.react-insecure-request
  if (!response.ok) throw new Error(`Chrome debugging endpoint returned ${response.status}.`);
  return response.json();
});
const page = targets.find(
  (target) => target.type === "page" && /^https:\/\/(?:www\.)?x\.com\//.test(target.url)
);
if (!page?.webSocketDebuggerUrl) {
  throw new Error("No X.com page is available on Chrome's localhost debugging endpoint.");
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let commandId = 0;
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});
function send(method, params = {}) {
  commandId += 1;
  return new Promise((resolve, reject) => {
    pending.set(commandId, { resolve, reject });
    socket.send(JSON.stringify({ id: commandId, method, params }));
  });
}

await send("Emulation.setDeviceMetricsOverride", {
  width: 1280,
  height: 800,
  deviceScaleFactor: 1,
  mobile: false
});
await send("Page.enable");
const previousFrame = await send("Page.getFrameTree");
const previousLoaderId = previousFrame.frameTree.frame.loaderId;
await send("Page.reload", { ignoreCache: true });
for (let attempt = 0; attempt < 100; attempt += 1) {
  const currentFrame = await send("Page.getFrameTree");
  if (currentFrame.frameTree.frame.loaderId !== previousLoaderId) break;
  await new Promise((resolve) => setTimeout(resolve, 50));
}
for (let attempt = 0; attempt < 100; attempt += 1) {
  const result = await send("Runtime.evaluate", {
    expression: `({
      article: Boolean(document.querySelector('article[data-testid="tweet"]')),
      uiReady: document.documentElement.dataset.xPimpUiReady === "true"
    })`,
    returnByValue: true
  });
  if (result.result?.value?.article && result.result.value.uiReady) break;
  await new Promise((resolve) => setTimeout(resolve, 100));
}
await send("Runtime.evaluate", {
  expression: `(() => {
    window.scrollTo({ left: 0, top: 0, behavior: "instant" });
    document.documentElement.dataset.xPimpStoreCapture = "true";
    const style = document.createElement("style");
    style.id = "x-pimp-store-capture-privacy";
    style.textContent = \`
      html[data-x-pimp-store-capture="true"] article > *,
      html[data-x-pimp-store-capture="true"] header[role="banner"] img,
      html[data-x-pimp-store-capture="true"] main img { opacity: 0 !important; }
      html[data-x-pimp-store-capture="true"] [data-testid*="UserAvatar-Container"] {
        background: rgb(63 63 70) !important;
        border-radius: 999px !important;
      }
      html[data-x-pimp-store-capture="true"] [data-testid*="UserAvatar-Container"] > * {
        visibility: hidden !important;
      }
      html[data-x-pimp-store-capture="true"] article {
        min-height: 210px !important;
        overflow: hidden !important;
        position: relative !important;
      }
      html[data-x-pimp-store-capture="true"] article::before {
        background:
          radial-gradient(circle at 36px 36px, rgb(110 231 183 / 22%) 0 21px, transparent 22px),
          linear-gradient(rgb(231 233 234 / 16%) 0 0) 78px 19px / 150px 12px no-repeat,
          linear-gradient(rgb(231 233 234 / 8%) 0 0) 78px 44px / 94px 9px no-repeat,
          linear-gradient(rgb(231 233 234 / 11%) 0 0) 20px 90px / 70% 10px no-repeat,
          linear-gradient(rgb(231 233 234 / 8%) 0 0) 20px 116px / 84% 10px no-repeat,
          linear-gradient(rgb(231 233 234 / 6%) 0 0) 20px 142px / 56% 10px no-repeat;
        border-radius: 12px;
        content: "";
        inset: 18px 22px;
        position: absolute;
      }
      html[data-x-pimp-store-capture="true"] .x-pimp-outline-label {
        color: transparent !important;
        position: relative !important;
      }
      html[data-x-pimp-store-capture="true"] .x-pimp-outline-label::after {
        color: rgb(231 233 234 / 62%) !important;
        content: "A quieter place to focus" !important;
        inset: 0 auto auto 0 !important;
        position: absolute !important;
        white-space: nowrap !important;
      }
      html[data-x-pimp-store-capture="true"] .x-pimp-outline-anchor:nth-child(2n) .x-pimp-outline-label::after {
        content: "Less noise, more signal" !important;
      }
      html[data-x-pimp-store-capture="true"] .x-pimp-outline-anchor:nth-child(3n) .x-pimp-outline-label::after {
        content: "Your feed, your pace" !important;
      }
    \`;
    document.getElementById(style.id)?.remove();
    document.head.append(style);
  })()`,
  awaitPromise: true
});
await new Promise((resolve) => setTimeout(resolve, 800));
const { data } = await send("Page.captureScreenshot", {
  format: "png",
  fromSurface: true,
  captureBeyondViewport: false
});
await writeFile(OUTPUT_PATH, Buffer.from(data, "base64"));
await send("Runtime.evaluate", {
  expression: `(() => {
    delete document.documentElement.dataset.xPimpStoreCapture;
    document.getElementById("x-pimp-store-capture-privacy")?.remove();
  })()`
});
await send("Emulation.clearDeviceMetricsOverride");
socket.close();
console.log(`Captured ${OUTPUT_PATH.pathname}`);
