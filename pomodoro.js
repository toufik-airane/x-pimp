(function startPomodoro() {
  "use strict";

  const STORAGE_KEY = "pomodoro";
  const DEFAULT_MINUTES = 15;
  const VALID_DURATIONS = new Set([15, 30, 45]);
  const SECOND = 1000;
  let state = createResetState(DEFAULT_MINUTES);
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
    const clock = widget.querySelector(".x-pimp-clock-time");
    clock.dateTime = now.toISOString();
    clock.textContent = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    }).format(now);
    widget.querySelector(".x-pimp-clock-date").textContent =
      new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        weekday: "short"
      }).format(now);
  }

  function persistState() {
    return chrome.storage.local.set({ [STORAGE_KEY]: state });
  }

  function render() {
    const widget = document.querySelector("#x-pimp-pomodoro");
    if (!widget) return;

    const remainingMs = getRemainingMs();
    const complete = remainingMs === 0;
    renderClock(widget);
    widget.querySelector(".x-pimp-pomodoro-time").textContent = formatTime(remainingMs);
    widget.querySelector(".x-pimp-pomodoro-status").textContent = complete
      ? "Done"
      : state.running
        ? "Focusing"
        : "Ready";
    widget.querySelector(".x-pimp-pomodoro-toggle").textContent = state.running
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
    if (!document.body || document.querySelector("#x-pimp-pomodoro")) return;

    const widget = document.createElement("aside");
    widget.id = "x-pimp-pomodoro";
    widget.setAttribute("aria-label", "Focus timer");
    widget.innerHTML = `
      <div class="x-pimp-clock">
        <time class="x-pimp-clock-time"></time>
        <span class="x-pimp-clock-date"></span>
      </div>
      <div class="x-pimp-pomodoro-heading">
        <strong>Focus</strong>
        <span class="x-pimp-pomodoro-status">Ready</span>
      </div>
      <time class="x-pimp-pomodoro-time" datetime="PT15M">15:00</time>
      <div class="x-pimp-pomodoro-presets" aria-label="Focus duration">
        <button type="button" data-minutes="15" aria-pressed="true">15</button>
        <button type="button" data-minutes="30" aria-pressed="false">30</button>
        <button type="button" data-minutes="45" aria-pressed="false">45</button>
      </div>
      <div class="x-pimp-pomodoro-actions">
        <button type="button" class="x-pimp-pomodoro-toggle">Start</button>
        <button type="button" class="x-pimp-pomodoro-reset">Reset</button>
      </div>
    `;

    widget.addEventListener("click", (event) => {
      const duration = event.target.closest?.("[data-minutes]");
      if (duration) {
        chooseDuration(Number(duration.dataset.minutes));
      } else if (event.target.closest?.(".x-pimp-pomodoro-toggle")) {
        toggleTimer();
      } else if (event.target.closest?.(".x-pimp-pomodoro-reset")) {
        resetTimer();
      }
    });

    document.body.append(widget);
    render();
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

  new MutationObserver(ensureWidget).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  ensureWidget();
  tickTimer = window.setInterval(render, 250);
  window.addEventListener("pagehide", () => window.clearInterval(tickTimer), {
    once: true
  });
})();
