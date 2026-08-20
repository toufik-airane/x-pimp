(function startXPimp() {
  "use strict";

  const { defaults, sanitize, storageKey } = globalThis.X_PIMP;
  const HOME_COOLDOWN_MS = 6000;
  const HOME_LINK_SELECTOR =
    'a[data-testid="AppTabBar_Home_Link"], a[href="/home"][role="link"]';
  const REFRESH_BUTTON_ID = "x-pimp-refresh";
  const REFRESH_COOLDOWN_KEY = "refreshCooldownUntil";
  const AD_LABELS = new Set([
    "Ad",
    "Promoted",
    "Sponsored",
    "Advertisement",
    "Anzeige",
    "Gesponsert",
    "Publicidad",
    "Promocionado",
    "Publicité",
    "Sponsorisé",
    "Annuncio",
    "Promosso",
    "Advertentie",
    "Gesponsord",
    "Anúncio",
    "Promovido",
    "広告",
    "プロモーション",
    "광고"
  ]);
  let adScanFrame;
  let forwardingRefresh = false;
  let refreshCooldownUntil = 0;
  let cooldownTimer;
  const cooldownReady = chrome.storage.local
    .get(REFRESH_COOLDOWN_KEY)
    .then((result) => {
      const storedValue = Number(result[REFRESH_COOLDOWN_KEY]);
      refreshCooldownUntil = Number.isFinite(storedValue) ? storedValue : 0;
    });

  function applySettings(value) {
    const settings = sanitize(value);
    document.documentElement.dataset.xPimpHideRightRail = String(
      settings.hideRightRail
    );
    document.documentElement.style.setProperty(
      "--x-pimp-feed-width",
      `${settings.feedWidth}px`
    );
  }

  function shakeButton(button) {
    button.classList.remove("x-pimp-shake");
    void button.offsetWidth;
    button.classList.add("x-pimp-shake");
    window.setTimeout(() => button.classList.remove("x-pimp-shake"), 450);
  }

  function showCooldown(trigger) {
    trigger.dataset.cooling = "true";
    window.clearTimeout(cooldownTimer);
    const remainingMs = Math.max(0, refreshCooldownUntil - Date.now());
    cooldownTimer = window.setTimeout(() => {
      trigger.dataset.cooling = "false";
    }, remainingMs);
  }

  async function tryRefresh(trigger) {
    await cooldownReady;
    if (Date.now() < refreshCooldownUntil) {
      shakeButton(trigger);
      return;
    }

    refreshCooldownUntil = Date.now() + HOME_COOLDOWN_MS;
    showCooldown(trigger);
    await chrome.storage.local.set({
      [REFRESH_COOLDOWN_KEY]: refreshCooldownUntil
    });

    const homeLink = document.querySelector(HOME_LINK_SELECTOR);
    if (homeLink) {
      forwardingRefresh = true;
      homeLink.click();
      forwardingRefresh = false;
    } else if (location.pathname !== "/home") {
      location.assign("/home");
    }
  }

  function ensureRefreshButton() {
    if (!document.body || document.querySelector(`#${REFRESH_BUTTON_ID}`)) {
      return;
    }

    const button = document.createElement("button");
    button.id = REFRESH_BUTTON_ID;
    button.type = "button";
    button.setAttribute("aria-label", "Refresh Home feed");
    button.title = "Refresh Home feed";
    button.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M19.5 6.4V3.5a1 1 0 1 1 2 0v5.2a1 1 0 0 1-1 1h-5.2a1 1 0 1 1 0-2h2.8A7.5 7.5 0 1 0 19 16a1 1 0 1 1 1.86.73A9.5 9.5 0 1 1 19.5 6.4Z"/>
      </svg>
    `;
    button.addEventListener("click", () => tryRefresh(button));
    document.body.append(button);
    cooldownReady.then(() => {
      if (Date.now() < refreshCooldownUntil) showCooldown(button);
    });
  }

  function handleHomeClick(event) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const homeLink = event.target.closest?.(HOME_LINK_SELECTOR);
    if (!homeLink) {
      return;
    }

    if (forwardingRefresh) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    tryRefresh(homeLink);
  }

  function markPromotedPosts() {
    adScanFrame = undefined;

    for (const article of document.querySelectorAll('article[data-testid="tweet"]')) {
      const isAd = [...article.querySelectorAll("span")].some(
        (span) =>
          AD_LABELS.has(span.textContent.trim()) &&
          !span.closest('[data-testid="tweetText"], [data-testid="User-Name"]')
      );
      article.toggleAttribute("data-x-pimp-ad", isAd);
    }
  }

  function scheduleAdScan() {
    ensureRefreshButton();
    if (adScanFrame === undefined) {
      adScanFrame = window.requestAnimationFrame(markPromotedPosts);
    }
  }

  applySettings(defaults);

  chrome.storage.sync.get(storageKey).then((result) => {
    applySettings(result[storageKey]);
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes[storageKey]) {
      applySettings(changes[storageKey].newValue);
    }
  });

  document.addEventListener("click", handleHomeClick, true);
  new MutationObserver(scheduleAdScan).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  scheduleAdScan();
  ensureRefreshButton();
})();
