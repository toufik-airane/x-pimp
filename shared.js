(function defineXPimpSettings(global) {
  "use strict";

  const defaults = Object.freeze({
    feedWidth: 720,
    hideRightRail: true
  });

  function normalizeFeedWidth(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return defaults.feedWidth;
    }

    const clamped = Math.min(900, Math.max(560, value));
    return Math.round(clamped / 20) * 20;
  }

  function sanitize(value) {
    return {
      feedWidth: normalizeFeedWidth(value?.feedWidth),
      hideRightRail:
        typeof value?.hideRightRail === "boolean"
          ? value.hideRightRail
          : defaults.hideRightRail
    };
  }

  function createCooldown(durationMs, now = () => performance.now()) {
    let lastAllowedAt = Number.NEGATIVE_INFINITY;

    return Object.freeze({
      attempt() {
        const currentTime = now();
        const elapsed = currentTime - lastAllowedAt;

        if (elapsed >= durationMs) {
          lastAllowedAt = currentTime;
          return { allowed: true, remainingMs: 0 };
        }

        return { allowed: false, remainingMs: durationMs - elapsed };
      }
    });
  }

  global.X_PIMP = Object.freeze({
    createCooldown,
    defaults,
    normalizeFeedWidth,
    sanitize,
    storageKey: "settings"
  });
})(globalThis);
