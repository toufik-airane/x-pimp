(function startTweetOutline() {
  "use strict";

  const OUTLINE_ID = "x-pimp-outline";
  const SCAN_DELAY_MS = 140;
  const TOP_READING_OFFSET_PX = 96;
  const MAX_LABEL_WORDS = 5;
  const MAX_LABEL_CHARACTERS = 48;
  const entriesByKey = new Map();
  const outlineEntries = [];
  const fallbackKeys = new WeakMap();
  let nextAnchorNumber = 1;
  let nextFallbackKey = 1;
  let scanTimer;
  let activeFrame;
  let activeButton;

  function isTrackable(article) {
    return (
      article.isConnected &&
      !article.hasAttribute("data-x-pimp-ad") &&
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
    outline.innerHTML = '<div class="x-pimp-outline-track"></div>';
    document.body.append(outline);
    return outline;
  }

  function getAnchorLabel(article, anchorNumber) {
    const postText = article
      .querySelector('[data-testid="tweetText"]')
      ?.textContent?.replace(/\s+/g, " ")
      .trim();
    if (!postText) return `Media post ${anchorNumber}`;

    const words = postText.split(" ");
    const firstWords = words.slice(0, MAX_LABEL_WORDS).join(" ");
    const clipped = firstWords.slice(0, MAX_LABEL_CHARACTERS).trimEnd();
    return words.length > MAX_LABEL_WORDS || firstWords.length > clipped.length
      ? `${clipped}…`
      : clipped;
  }

  function updateAnchorLabel(entry) {
    const label = getAnchorLabel(
      entry.article,
      entry.button.dataset.anchorNumber
    );
    const labelElement = entry.button.querySelector(".x-pimp-outline-label");
    if (labelElement.textContent !== label) labelElement.textContent = label;
    entry.button.setAttribute("aria-label", `Go to post: ${label}`);
    entry.button.title = label;
  }

  function rememberPosition(entry) {
    if (!isTrackable(entry.article)) return;
    const rect = entry.article.getBoundingClientRect();
    entry.lastKnownCenter = window.scrollY + rect.top + rect.height / 2;
  }

  function createEntry(article, key) {
    const anchorNumber = nextAnchorNumber++;
    const entry = {
      article,
      button: null,
      key,
      lastKnownCenter: null
    };
    const button = document.createElement("button");
    entry.button = button;
    button.type = "button";
    button.className = "x-pimp-outline-anchor";
    button.dataset.anchorNumber = String(anchorNumber);
    const label = document.createElement("span");
    label.className = "x-pimp-outline-label";
    button.append(label);
    updateAnchorLabel(entry);
    rememberPosition(entry);
    button.addEventListener("click", () => {
      const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
      if (isTrackable(entry.article)) {
        rememberPosition(entry);
        entry.article.scrollIntoView({ behavior, block: "center" });
      } else if (Number.isFinite(entry.lastKnownCenter)) {
        window.scrollTo({
          top: Math.max(0, entry.lastKnownCenter - window.innerHeight / 2),
          behavior
        });
      }
    });
    return entry;
  }

  function keepActiveVisible(button) {
    const track = document.querySelector(".x-pimp-outline-track");
    if (!track || !button) return;
    const top = button.offsetTop;
    const bottom = top + button.offsetHeight;
    if (top < track.scrollTop) track.scrollTop = top;
    else if (bottom > track.scrollTop + track.clientHeight) {
      track.scrollTop = bottom - track.clientHeight;
    }
  }

  function updateActiveAnchor() {
    activeFrame = undefined;
    let nearestButton;
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
      }
    }

    for (const button of document.querySelectorAll(".x-pimp-outline-anchor")) {
      const active = button === nearestButton;
      button.dataset.active = String(active);
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    }
    if (nearestButton !== activeButton) keepActiveVisible(nearestButton);
    activeButton = nearestButton;
  }

  function scheduleActiveUpdate() {
    if (activeFrame === undefined) {
      activeFrame = window.requestAnimationFrame(updateActiveAnchor);
    }
  }

  function scanTweets() {
    scanTimer = undefined;
    const outline = ensureOutline();
    if (!outline) return;

    const articles = getTrackableArticles();
    const currentEntries = [];
    articles.forEach((article, articleIndex) => {
      const key = getArticleKey(article);
      let entry = entriesByKey.get(key);
      if (!entry) {
        entry = createEntry(article, key);
        entriesByKey.set(key, entry);

        let insertionIndex = outlineEntries.length;
        for (let index = articleIndex + 1; index < articles.length; index++) {
          const nextEntry = entriesByKey.get(getArticleKey(articles[index]));
          if (nextEntry) {
            insertionIndex = outlineEntries.indexOf(nextEntry);
            break;
          }
        }
        if (insertionIndex === outlineEntries.length && currentEntries.length) {
          insertionIndex = outlineEntries.indexOf(currentEntries.at(-1)) + 1;
        }
        outlineEntries.splice(insertionIndex, 0, entry);
      } else {
        entry.article = article;
      }

      updateAnchorLabel(entry);
      rememberPosition(entry);
      currentEntries.push(entry);
    });

    for (const entry of [...outlineEntries]) {
      if (!entry.article?.hasAttribute("data-x-pimp-ad")) continue;
      entry.button.remove();
      entriesByKey.delete(entry.key);
      outlineEntries.splice(outlineEntries.indexOf(entry), 1);
    }

    const track = outline.querySelector(".x-pimp-outline-track");
    const orderedButtons = outlineEntries.map((entry) => entry.button);
    const currentButtons = [...track.children];
    if (
      currentButtons.length !== orderedButtons.length ||
      currentButtons.some((button, index) => button !== orderedButtons[index])
    ) {
      track.replaceChildren(...orderedButtons);
    }

    outline.dataset.empty = String(outlineEntries.length === 0);
    outline.style.setProperty(
      "--x-pimp-outline-count",
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
    attributeFilter: ["data-x-pimp-ad"],
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
      if (activeFrame !== undefined) window.cancelAnimationFrame(activeFrame);
    },
    { once: true }
  );
  scheduleScan();
})();
