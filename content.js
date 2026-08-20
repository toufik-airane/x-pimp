(function startXPimp() {
  "use strict";

  const { defaults, sanitize, storageKey } = globalThis.X_PIMP;
  const HOME_COOLDOWN_MS = 6000;
  const HOME_LINK_SELECTOR =
    'a[data-testid="AppTabBar_Home_Link"], a[href="/home"][role="link"]';
  const HOME_BUTTON_ID = "x-pimp-home";
  const REFRESH_BUTTON_ID = "x-pimp-refresh";
  const REFRESH_COOLDOWN_KEY = "refreshCooldownUntil";
  const POMODORO_DURATION_BY_CODE = Object.freeze({
    Digit1: 15,
    Digit2: 30,
    Digit3: 45,
    Numpad1: 15,
    Numpad2: 30,
    Numpad3: 45
  });
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
    const controls = new Set([
      trigger,
      document.querySelector(`#${HOME_BUTTON_ID}`),
      document.querySelector(`#${REFRESH_BUTTON_ID}`)
    ]);
    controls.delete(null);
    for (const control of controls) control.dataset.cooling = "true";
    window.clearTimeout(cooldownTimer);
    const remainingMs = Math.max(0, refreshCooldownUntil - Date.now());
    cooldownTimer = window.setTimeout(() => {
      for (const control of controls) control.dataset.cooling = "false";
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

  function createFloatingControl({ id, label, path, shortcut, title }) {
    const button = document.createElement("button");
    button.id = id;
    button.type = "button";
    button.setAttribute("aria-label", label);
    if (shortcut) button.setAttribute("aria-keyshortcuts", shortcut);
    button.title = title;
    button.innerHTML = `
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="${path}"/>
      </svg>
    `;
    button.addEventListener("click", () => tryRefresh(button));
    document.body.append(button);
    cooldownReady.then(() => {
      if (Date.now() < refreshCooldownUntil) showCooldown(button);
    });
    return button;
  }

  function ensureRefreshButton() {
    if (!document.body || document.querySelector(`#${REFRESH_BUTTON_ID}`)) {
      return;
    }

    createFloatingControl({
      id: REFRESH_BUTTON_ID,
      label: "Refresh Home feed",
      path: "M19.5 6.4V3.5a1 1 0 1 1 2 0v5.2a1 1 0 0 1-1 1h-5.2a1 1 0 1 1 0-2h2.8A7.5 7.5 0 1 0 19 16a1 1 0 1 1 1.86.73A9.5 9.5 0 1 1 19.5 6.4Z",
      shortcut: "Alt+R",
      title: "Refresh Home feed (Alt/Option + R)"
    });
  }

  function ensureHomeButton() {
    if (!document.body) return;

    let button = document.querySelector(`#${HOME_BUTTON_ID}`);
    if (!button) {
      button = createFloatingControl({
        id: HOME_BUTTON_ID,
        label: "Home",
        path: "M12 2 2.5 9.2v12.3h7.1v-7h4.8v7h7.1V9.2L12 2Zm7.7 17.7h-3.5v-7H7.8v7H4.3v-9.6L12 4.3l7.7 5.8v9.6Z",
        title: "Home"
      });
    }

    const isHome = location.pathname === "/home";
    button.dataset.active = String(isHome);
    if (isHome) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }

  function ensureInterfaceControls() {
    ensureHomeButton();
    ensureRefreshButton();
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

  function isEditableTarget(target) {
    return (
      target instanceof Element &&
      Boolean(
        target.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]'
        )
      )
    );
  }

  function clickPomodoroControl(selector) {
    const control = document.querySelector(`#x-pimp-pomodoro ${selector}`);
    if (!control) return false;
    control.click();
    return true;
  }

  function handleKeyboardShortcut(event) {
    if (
      !event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.repeat ||
      isEditableTarget(event.target)
    ) {
      return;
    }

    let handled = false;

    if (event.code === "KeyR") {
      ensureInterfaceControls();
      const refreshButton = document.querySelector(`#${REFRESH_BUTTON_ID}`);
      if (refreshButton) {
        tryRefresh(refreshButton);
        handled = true;
      }
    } else if (event.code === "KeyP") {
      handled = clickPomodoroControl(".x-pimp-pomodoro-toggle");
    } else {
      const duration = POMODORO_DURATION_BY_CODE[event.code];
      if (duration) {
        handled = clickPomodoroControl(`[data-minutes="${duration}"]`);
      }
    }

    if (handled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
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
    ensureInterfaceControls();
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
  window.addEventListener("keydown", handleKeyboardShortcut, true);
  new MutationObserver(scheduleAdScan).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  scheduleAdScan();
  ensureInterfaceControls();
})();
