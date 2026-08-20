(function startPopup() {
  "use strict";

  const { defaults, sanitize, storageKey } = globalThis.X_PIMP;
  const toggle = document.querySelector("#hide-right-rail");
  const feedWidth = document.querySelector("#feed-width");
  const feedWidthValue = document.querySelector("#feed-width-value");
  const status = document.querySelector("#status");
  let statusTimer;
  let currentSettings = defaults;

  function showStatus(message) {
    window.clearTimeout(statusTimer);
    status.textContent = message;
    statusTimer = window.setTimeout(() => {
      status.textContent = "";
    }, 1400);
  }

  chrome.storage.sync.get(storageKey).then((result) => {
    currentSettings = sanitize(result[storageKey] ?? defaults);
    toggle.checked = currentSettings.hideRightRail;
    feedWidth.value = String(currentSettings.feedWidth);
    feedWidthValue.value = `${currentSettings.feedWidth} px`;
  });

  toggle.addEventListener("change", async () => {
    currentSettings = sanitize({
      ...currentSettings,
      hideRightRail: toggle.checked
    });
    await chrome.storage.sync.set({ [storageKey]: currentSettings });
    showStatus(toggle.checked ? "Right rail removed" : "Right rail restored");
  });

  feedWidth.addEventListener("input", () => {
    feedWidthValue.value = `${feedWidth.value} px`;
  });

  feedWidth.addEventListener("change", async () => {
    currentSettings = sanitize({
      ...currentSettings,
      feedWidth: Number(feedWidth.value)
    });
    feedWidth.value = String(currentSettings.feedWidth);
    feedWidthValue.value = `${currentSettings.feedWidth} px`;
    await chrome.storage.sync.set({ [storageKey]: currentSettings });
    showStatus("Feed width updated");
  });
})();
