(function startTweetOutline() {
  "use strict";

  const OUTLINE_ID = "x-pimp-outline";
  const SCAN_DELAY_MS = 140;
  const trackedTweets = new Map();
  let nextAnchorNumber = 1;
  let scanTimer;
  let activeFrame;

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

  function createAnchor(article, batchStart) {
    const anchorNumber = nextAnchorNumber++;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "x-pimp-outline-anchor";
    button.dataset.batchStart = String(batchStart);
    button.setAttribute("aria-label", `Go to loaded post ${anchorNumber}`);
    button.title = `Post ${anchorNumber}`;
    button.addEventListener("click", () => {
      const anchorIndex = [
        ...document.querySelectorAll(".x-pimp-outline-anchor")
      ].indexOf(button);
      const target = getTrackableArticles()[anchorIndex] ?? article;
      if (!isTrackable(target)) return;
      target.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center"
      });
    });
    return button;
  }

  function updateActiveAnchor() {
    activeFrame = undefined;
    const viewportCenter = window.innerHeight / 2;
    let nearestButton;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const [article, button] of trackedTweets) {
      if (!isTrackable(article)) continue;
      const rect = article.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestButton = button;
      }
    }

    for (const button of document.querySelectorAll(".x-pimp-outline-anchor")) {
      const active = button === nearestButton;
      button.dataset.active = String(active);
      if (active) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    }
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
    const newArticles = articles.filter((article) => !trackedTweets.has(article));

    newArticles.forEach((article, index) => {
      trackedTweets.set(article, createAnchor(article, index === 0));
    });

    for (const [article, button] of trackedTweets) {
      if (!isTrackable(article)) {
        button.remove();
        trackedTweets.delete(article);
      }
    }

    const track = outline.querySelector(".x-pimp-outline-track");
    const orderedButtons = [];
    for (const article of articles) {
      const button = trackedTweets.get(article);
      if (button) orderedButtons.push(button);
    }
    const currentButtons = [...track.children];
    if (
      currentButtons.length !== orderedButtons.length ||
      currentButtons.some((button, index) => button !== orderedButtons[index])
    ) {
      track.replaceChildren(...orderedButtons);
    }

    outline.dataset.empty = String(trackedTweets.size === 0);
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
