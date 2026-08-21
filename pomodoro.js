(function startPomodoro() {
  "use strict";

  const STORAGE_KEY = "pomodoro";
  const DEFAULT_MINUTES = 15;
  const VALID_DURATIONS = new Set([15, 30, 45]);
  const SECOND = 1000;
  const CLOCK_FORMATTER = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  });
  const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    weekday: "short"
  });
  let state = createResetState(DEFAULT_MINUTES);
  let bootObserver;
  let tickTimer;
  let completionSaved = false;

  function createResetState(durationMinutes) {
    return {
      durationMinutes,
      endAt: null,
      remainingMs: durationMinutes * 60 * SECOND,
      running: false
    };
  }

  function sanitizeState(value) {
    const durationMinutes = VALID_DURATIONS.has(value?.durationMinutes)
      ? value.durationMinutes
      : DEFAULT_MINUTES;
    const maximum = durationMinutes * 60 * SECOND;
    const remainingMs = Number.isFinite(value?.remainingMs)
      ? Math.min(maximum, Math.max(0, value.remainingMs))
      : maximum;
    const endAt = Number.isFinite(value?.endAt) ? value.endAt : null;
    const running = value?.running === true && endAt !== null;

    return { durationMinutes, endAt, remainingMs, running };
  }

  function getRemainingMs() {
    return state.running
      ? Math.max(0, state.endAt - Date.now())
      : state.remainingMs;
  }

  function formatTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / SECOND));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function renderClock(widget) {
    const now = new Date();
    const clock = widget.querySelector(".x-zen-clock-time");
    clock.dateTime = now.toISOString();
    clock.textContent = CLOCK_FORMATTER.format(now);
    widget.querySelector(".x-zen-clock-date").textContent =
      DATE_FORMATTER.format(now);
  }

  function persistState() {
    return chrome.storage.local.set({ [STORAGE_KEY]: state });
  }

  function render() {
    const widget = document.querySelector("#x-zen-pomodoro");
    if (!widget) return;

    const remainingMs = getRemainingMs();
    const complete = remainingMs === 0;
    renderClock(widget);
    widget.querySelector(".x-zen-pomodoro-time").textContent = formatTime(remainingMs);
    widget.querySelector(".x-zen-pomodoro-status").textContent = complete
      ? "Done"
      : state.running
        ? "Focusing"
        : "Ready";
    widget.querySelector(".x-zen-pomodoro-toggle").textContent = state.running
      ? "Pause"
      : complete
        ? "Restart"
        : "Start";
    widget.dataset.running = String(state.running);
    widget.dataset.complete = String(complete);

    for (const button of widget.querySelectorAll("[data-minutes]")) {
      const selected = Number(button.dataset.minutes) === state.durationMinutes;
      button.setAttribute("aria-pressed", String(selected));
    }

    if (complete && state.running && !completionSaved) {
      completionSaved = true;
      state = { ...state, endAt: null, remainingMs: 0, running: false };
      persistState();
    }
  }

  function chooseDuration(durationMinutes) {
    state = createResetState(durationMinutes);
    completionSaved = false;
    persistState();
    render();
  }

  function toggleTimer() {
    const remainingMs = getRemainingMs();

    if (state.running) {
      state = { ...state, endAt: null, remainingMs, running: false };
    } else {
      const nextRemaining = remainingMs || state.durationMinutes * 60 * SECOND;
      state = {
        ...state,
        endAt: Date.now() + nextRemaining,
        remainingMs: nextRemaining,
        running: true
      };
    }

    completionSaved = false;
    persistState();
    render();
  }

  function resetTimer() {
    state = createResetState(state.durationMinutes);
    completionSaved = false;
    persistState();
    render();
  }

  function ensureWidget() {
    if (!document.body) return false;
    if (document.querySelector("#x-zen-pomodoro")) return true;

    const widget = document.createElement("aside");
    widget.id = "x-zen-pomodoro";
    widget.setAttribute("aria-label", "Focus timer");
    widget.innerHTML = `
      <div class="x-zen-clock">
        <time class="x-zen-clock-time"></time>
        <span class="x-zen-clock-date"></span>
      </div>
      <div class="x-zen-pomodoro-heading">
        <strong>Focus</strong>
        <span class="x-zen-pomodoro-status">Ready</span>
      </div>
      <time class="x-zen-pomodoro-time" datetime="PT15M">15:00</time>
      <div class="x-zen-pomodoro-presets" aria-label="Focus duration">
        <button type="button" data-minutes="15" aria-pressed="true" aria-keyshortcuts="Alt+1" title="15 minutes (Alt/Option + 1)">15</button>
        <button type="button" data-minutes="30" aria-pressed="false" aria-keyshortcuts="Alt+2" title="30 minutes (Alt/Option + 2)">30</button>
        <button type="button" data-minutes="45" aria-pressed="false" aria-keyshortcuts="Alt+3" title="45 minutes (Alt/Option + 3)">45</button>
      </div>
      <div class="x-zen-pomodoro-actions">
        <button type="button" class="x-zen-pomodoro-reset">Reset</button>
        <button type="button" class="x-zen-pomodoro-toggle" aria-keyshortcuts="Alt+P" title="Start or pause (Alt/Option + P)">Start</button>
      </div>
      <div class="x-zen-shortcut-hint" aria-label="Keyboard shortcuts">
        ⌥R refresh · ⌥P timer<br>⌥1/2/3 length
      </div>
    `;

    widget.addEventListener("click", (event) => {
      const duration = event.target.closest?.("[data-minutes]");
      if (duration) {
        chooseDuration(Number(duration.dataset.minutes));
      } else if (event.target.closest?.(".x-zen-pomodoro-toggle")) {
        toggleTimer();
      } else if (event.target.closest?.(".x-zen-pomodoro-reset")) {
        resetTimer();
      }
    });

    document.body.append(widget);
    render();
    return true;
  }

  function bootWidget() {
    if (ensureWidget()) bootObserver?.disconnect();
  }

  chrome.storage.local.get(STORAGE_KEY).then((result) => {
    state = sanitizeState(result[STORAGE_KEY]);
    ensureWidget();
    render();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY]) {
      state = sanitizeState(changes[STORAGE_KEY].newValue);
      completionSaved = false;
      render();
    }
  });

  bootObserver = new MutationObserver(bootWidget);
  bootObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  bootWidget();
  tickTimer = window.setInterval(render, 250);
  window.addEventListener(
    "pagehide",
    () => {
      bootObserver.disconnect();
      window.clearInterval(tickTimer);
    },
    { once: true }
  );
})();
