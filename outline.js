(function startTweetOutline() {
  "use strict";

  const OUTLINE_ID = "x-zen-outline";
  const SCAN_DELAY_MS = 140;
  const DISCONNECTED_GRACE_MS = 2000;
  const TOP_READING_OFFSET_PX = 96;
  const { getAnchorLabel } = globalThis.X_ZEN_OUTLINE_LABELS;
  const entriesByKey = new Map();
  const outlineEntries = [];
  const fallbackKeys = new WeakMap();
  let nextAnchorNumber = 1;
  let nextFallbackKey = 1;
  let scanTimer;
  let staleCleanupTimer;
  let activeFrame;
  let currentEntry;

  function isTrackable(article) {
    return (
      article.isConnected &&
      !article.hasAttribute("data-x-zen-ad") &&
      Boolean(article.closest('[data-testid="primaryColumn"]'))
    );
  }

  function getTrackableArticles() {
    return [
      ...document.querySelectorAll(
        '[data-testid="primaryColumn"] article[data-testid="tweet"]'
      )
    ].filter(isTrackable);
  }

  function getArticleKey(article) {
    const statusLink =
      article.querySelector('a[href*="/status/"] time')?.closest("a") ??
      article.querySelector('a[href*="/status/"]');
    const statusId = statusLink
      ?.getAttribute("href")
      ?.match(/\/status\/(\d+)/)?.[1];
    if (statusId) return `status:${statusId}`;

    let fallbackKey = fallbackKeys.get(article);
    if (!fallbackKey) {
      fallbackKey = `dom:${nextFallbackKey++}`;
      fallbackKeys.set(article, fallbackKey);
    }
    return fallbackKey;
  }

  function ensureOutline() {
    if (!document.body) return null;

    let outline = document.querySelector(`#${OUTLINE_ID}`);
    if (outline) return outline;

    outline = document.createElement("nav");
    outline.id = OUTLINE_ID;
    outline.setAttribute("aria-label", "Tweet outline");
    outline.dataset.empty = "true";
    outline.innerHTML = `
      <button type="button" class="x-zen-outline-anchor x-zen-outline-current" hidden>
        <span class="x-zen-outline-label"></span>
      </button>
      <div class="x-zen-outline-track"></div>
    `;
    outline
      .querySelector(".x-zen-outline-current")
      .addEventListener("click", () => {
        if (currentEntry) navigateToEntry(currentEntry);
      });
    outline
      .querySelector(".x-zen-outline-track")
      .addEventListener("scroll", scheduleActiveUpdate, { passive: true });
    document.body.append(outline);
    return outline;
  }

  function updateAnchorLabel(entry) {
    const label = getAnchorLabel(
      entry.article,
      entry.button.dataset.anchorNumber
    );
    const labelElement = entry.button.querySelector(".x-zen-outline-label");
    if (labelElement.textContent !== label) labelElement.textContent = label;
    entry.button.setAttribute("aria-label", `Go to post: ${label}`);
    entry.button.title = label;
  }

  function rememberPosition(entry) {
    if (!isTrackable(entry.article)) return;
    const rect = entry.article.getBoundingClientRect();
    entry.lastKnownTop = window.scrollY + rect.top;
  }

  function navigateToEntry(entry) {
    const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    if (isTrackable(entry.article)) rememberPosition(entry);
    if (!Number.isFinite(entry.lastKnownTop)) return;
    window.scrollTo({
      top: Math.max(0, entry.lastKnownTop - TOP_READING_OFFSET_PX),
      behavior
    });
  }

  function updateCurrentAnchor(entry) {
    const button = document.querySelector(".x-zen-outline-current");
    const track = document.querySelector(".x-zen-outline-track");
    if (!button || !track) return;
    currentEntry = entry;
    const entryIsVisible = Boolean(
      entry &&
        entry.button.dataset.disconnected !== "true" &&
        entry.button.offsetTop >= track.scrollTop &&
        entry.button.offsetTop + entry.button.offsetHeight <=
          track.scrollTop + track.clientHeight
    );
    button.hidden = !entry || entryIsVisible;
    if (!entry) return;

    const label = entry.button.querySelector(".x-zen-outline-label").textContent;
    button.querySelector(".x-zen-outline-label").textContent = label;
    button.setAttribute("aria-label", `Current post: ${label}`);
    button.title = label;
    button.dataset.active = "true";
    button.setAttribute("aria-current", "true");
  }

  function createEntry(article, key) {
    const anchorNumber = nextAnchorNumber++;
    const entry = {
      article,
      button: null,
      disconnectedAt: null,
      key,
      lastKnownTop: null
    };
    const button = document.createElement("button");
    entry.button = button;
    button.type = "button";
    button.className = "x-zen-outline-anchor";
    button.dataset.anchorNumber = String(anchorNumber);
    const label = document.createElement("span");
    label.className = "x-zen-outline-label";
    button.append(label);
    updateAnchorLabel(entry);
    rememberPosition(entry);
    button.addEventListener("click", () => {
      updateCurrentAnchor(entry);
      navigateToEntry(entry);
    });
    return entry;
  }

  function removeEntry(entry) {
    entry.button.remove();
    entriesByKey.delete(entry.key);
    const index = outlineEntries.indexOf(entry);
    if (index !== -1) outlineEntries.splice(index, 1);
  }

  function updateActiveAnchor() {
    activeFrame = undefined;
    let nearestButton;
    let nearestEntry;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const entry of outlineEntries) {
      if (!isTrackable(entry.article)) continue;
      rememberPosition(entry);
      const rect = entry.article.getBoundingClientRect();
      const distance =
        rect.top <= TOP_READING_OFFSET_PX && rect.bottom >= TOP_READING_OFFSET_PX
          ? 0
          : Math.min(
              Math.abs(rect.top - TOP_READING_OFFSET_PX),
              Math.abs(rect.bottom - TOP_READING_OFFSET_PX)
            );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestButton = entry.button;
        nearestEntry = entry;
      }
    }

    for (const button of document.querySelectorAll(".x-zen-outline-anchor")) {
      const active = button === nearestButton;
      button.dataset.active = String(active);
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    }
    updateCurrentAnchor(nearestEntry);
  }

  function scheduleActiveUpdate() {
    if (activeFrame === undefined) {
      activeFrame = window.requestAnimationFrame(updateActiveAnchor);
    }
  }

  function reconcileTrack(track, orderedButtons) {
    const expectedButtons = new Set(orderedButtons);
    for (const button of [...track.children]) {
      if (!expectedButtons.has(button)) button.remove();
    }
    orderedButtons.forEach((button, index) => {
      const currentButton = track.children[index];
      if (currentButton !== button) {
        track.insertBefore(button, currentButton ?? null);
      }
    });
  }

  function scanTweets() {
    scanTimer = undefined;
    const outline = ensureOutline();
    if (!outline) return;

    const articles = getTrackableArticles();
    const currentKeys = new Set();
    const currentEntries = [];
    articles.forEach((article) => {
      const key = getArticleKey(article);
      if (currentKeys.has(key)) return;
      currentKeys.add(key);
      let entry = entriesByKey.get(key);
      if (!entry) {
        entry = createEntry(article, key);
        entriesByKey.set(key, entry);
        outlineEntries.push(entry);
      } else {
        entry.article = article;
      }

      entry.disconnectedAt = null;
      entry.button.dataset.disconnected = "false";
      updateAnchorLabel(entry);
      rememberPosition(entry);
      currentEntries.push(entry);
    });

    window.clearTimeout(staleCleanupTimer);
    let nextCleanupDelay = Number.POSITIVE_INFINITY;
    const now = Date.now();
    for (const entry of [...outlineEntries]) {
      if (entry.article?.hasAttribute("data-x-zen-ad")) {
        removeEntry(entry);
        continue;
      }
      if (currentKeys.has(entry.key)) continue;

      entry.disconnectedAt ??= now;
      entry.button.dataset.disconnected = "true";
      const remaining = DISCONNECTED_GRACE_MS - (now - entry.disconnectedAt);
      if (remaining <= 0) removeEntry(entry);
      else nextCleanupDelay = Math.min(nextCleanupDelay, remaining);
    }
    if (Number.isFinite(nextCleanupDelay)) {
      staleCleanupTimer = window.setTimeout(
        scheduleScan,
        nextCleanupDelay + SCAN_DELAY_MS
      );
    }

    const track = outline.querySelector(".x-zen-outline-track");
    const disconnectedEntries = outlineEntries.filter(
      (entry) => !currentKeys.has(entry.key)
    );
    outlineEntries.splice(
      0,
      outlineEntries.length,
      ...currentEntries,
      ...disconnectedEntries
    );
    const orderedButtons = outlineEntries.map((entry) => entry.button);
    reconcileTrack(track, orderedButtons);

    outline.dataset.empty = String(outlineEntries.length === 0);
    outline.style.setProperty(
      "--x-zen-outline-count",
      String(outlineEntries.length)
    );
    updateActiveAnchor();
  }

  function scheduleScan() {
    if (scanTimer === undefined) {
      scanTimer = window.setTimeout(scanTweets, SCAN_DELAY_MS);
    }
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-x-zen-ad"],
    childList: true,
    subtree: true
  });

  window.addEventListener("scroll", scheduleActiveUpdate, { passive: true });
  window.addEventListener("resize", scheduleActiveUpdate, { passive: true });
  window.addEventListener(
    "pagehide",
    () => {
      observer.disconnect();
      window.clearTimeout(scanTimer);
      window.clearTimeout(staleCleanupTimer);
      if (activeFrame !== undefined) window.cancelAnimationFrame(activeFrame);
    },
    { once: true }
  );
  scheduleScan();
})();
