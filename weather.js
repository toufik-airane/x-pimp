(function startLocalWeather() {
  "use strict";

  const STORAGE_KEY = "weather";
  const STALE_AFTER_MS = 30 * 60 * 1000;
  const WIDGET_GAP_PX = 14;
  let weatherState = { data: null, enabled: false };
  let bootObserver;
  let loading = false;
  let observedPomodoro;
  let positionFrame;
  let weatherTimer;
  let widgetResizeObserver;

  function scheduleWidgetPosition() {
    if (positionFrame !== undefined) return;
    positionFrame = window.requestAnimationFrame(() => {
      positionFrame = undefined;
      const pomodoro = document.querySelector("#x-zen-pomodoro");
      const weather = document.querySelector("#x-zen-weather");
      if (!pomodoro || !weather) return;
      weather.style.top = `${
        pomodoro.getBoundingClientRect().bottom + WIDGET_GAP_PX
      }px`;
    });
  }

  function observeWidgetPosition() {
    const pomodoro = document.querySelector("#x-zen-pomodoro");
    if (!pomodoro) return false;
    if (pomodoro !== observedPomodoro) {
      widgetResizeObserver ??= new ResizeObserver(scheduleWidgetPosition);
      widgetResizeObserver.disconnect();
      widgetResizeObserver.observe(pomodoro);
      observedPomodoro = pomodoro;
    }
    scheduleWidgetPosition();
    return true;
  }

  function describeWeather(code) {
    if (code === 0) return "Clear";
    if (code === 1) return "Mostly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if (code === 45 || code === 48) return "Foggy";
    if (code >= 51 && code <= 57) return "Drizzle";
    if (code >= 61 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Showers";
    if (code === 85 || code === 86) return "Snow showers";
    if (code >= 95) return "Thunderstorm";
    return "Mixed conditions";
  }

  function sanitizeData(value) {
    const numericKeys = [
      "apparentTemperature",
      "high",
      "low",
      "temperature",
      "updatedAt",
      "weatherCode"
    ];
    if (!numericKeys.every((key) => Number.isFinite(value?.[key]))) return null;

    return Object.fromEntries(numericKeys.map((key) => [key, value[key]]));
  }

  function relativeUpdateTime(updatedAt) {
    const minutes = Math.max(0, Math.floor((Date.now() - updatedAt) / 60000));
    if (minutes < 1) return "Updated now";
    return `Updated ${minutes} min ago`;
  }

  function render(message = "") {
    const widget = document.querySelector("#x-zen-weather");
    if (!widget) return;

    const data = weatherState.data;
    widget.dataset.loading = String(loading);
    widget.querySelector(".x-zen-weather-consent").hidden = Boolean(data);
    widget.querySelector(".x-zen-weather-current").hidden = !data;
    widget.querySelector(".x-zen-weather-disable").hidden = !weatherState.enabled;
    widget.querySelector(".x-zen-weather-status").textContent =
      message || (loading ? "Updating" : data ? relativeUpdateTime(data.updatedAt) : "Opt in");

    if (data) {
      widget.querySelector(".x-zen-weather-temperature").textContent = `${Math.round(data.temperature)}°`;
      widget.querySelector(".x-zen-weather-condition").textContent = describeWeather(data.weatherCode);
      widget.querySelector(".x-zen-weather-range").textContent =
        `H ${Math.round(data.high)}°  L ${Math.round(data.low)}°  Feels ${Math.round(data.apparentTemperature)}°`;
    }
  }

  function getPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        maximumAge: STALE_AFTER_MS,
        timeout: 12000
      });
    });
  }

  async function updateWeather() {
    if (loading) return;
    loading = true;
    render();

    try {
      const position = await getPosition();
      const query = new URLSearchParams({
        current: "temperature_2m,apparent_temperature,weather_code",
        daily: "temperature_2m_max,temperature_2m_min",
        forecast_days: "1",
        latitude: Number(position.coords.latitude.toFixed(2)).toString(),
        longitude: Number(position.coords.longitude.toFixed(2)).toString(),
        temperature_unit: "celsius",
        timezone: "auto"
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
      if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
      const payload = await response.json();
      const data = sanitizeData({
        apparentTemperature: payload.current?.apparent_temperature,
        high: payload.daily?.temperature_2m_max?.[0],
        low: payload.daily?.temperature_2m_min?.[0],
        temperature: payload.current?.temperature_2m,
        updatedAt: Date.now(),
        weatherCode: payload.current?.weather_code
      });
      if (!data) throw new Error("Weather response was incomplete");

      weatherState = { data, enabled: true };
      await chrome.storage.local.set({ [STORAGE_KEY]: weatherState });
    } catch (error) {
      if (!weatherState.data) weatherState.enabled = false;
      render(error?.code === 1 ? "Location access is off" : "Weather unavailable");
    } finally {
      loading = false;
      render();
    }
  }

  async function disableWeather() {
    weatherState = { data: null, enabled: false };
    await chrome.storage.local.remove(STORAGE_KEY);
    render();
  }

  function ensureWidget() {
    if (!document.body) return false;
    if (document.querySelector("#x-zen-weather")) return true;

    const widget = document.createElement("aside");
    widget.id = "x-zen-weather";
    widget.setAttribute("aria-label", "Local weather");
    widget.innerHTML = `
      <div class="x-zen-weather-heading">
        <strong>Weather</strong>
        <button type="button" class="x-zen-weather-update" aria-label="Update local weather">↻</button>
      </div>
      <div class="x-zen-weather-consent">
        <p>Your browser provides your location. x-zen rounds it, then sends it to Open-Meteo for current conditions. x-zen does not store your coordinates.</p>
        <button type="button" class="x-zen-weather-enable">Share approximate location</button>
      </div>
      <div class="x-zen-weather-current" hidden>
        <div class="x-zen-weather-temperature">--°</div>
        <div class="x-zen-weather-condition">Unavailable</div>
        <div class="x-zen-weather-range"></div>
      </div>
      <div class="x-zen-weather-footer">
        <span class="x-zen-weather-status">Opt in</span>
        <button type="button" class="x-zen-weather-disable" hidden>Turn off</button>
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>
      </div>
    `;
    widget.addEventListener("click", (event) => {
      if (event.target.closest?.(".x-zen-weather-disable")) {
        disableWeather();
      } else if (event.target.closest?.(".x-zen-weather-enable, .x-zen-weather-update")) {
        updateWeather();
      }
    });
    document.body.append(widget);
    render();
    return true;
  }

  function bootWidgets() {
    if (ensureWidget() && observeWidgetPosition()) bootObserver?.disconnect();
  }

  chrome.storage.local.get(STORAGE_KEY).then((result) => {
    weatherState = {
      data: sanitizeData(result[STORAGE_KEY]?.data),
      enabled: result[STORAGE_KEY]?.enabled === true
    };
    bootWidgets();
    render();
    if (
      weatherState.enabled &&
      (!weatherState.data || Date.now() - weatherState.data.updatedAt >= STALE_AFTER_MS)
    ) {
      updateWeather();
    }
  });

  bootObserver = new MutationObserver(bootWidgets);
  bootObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  window.addEventListener("resize", scheduleWidgetPosition, { passive: true });
  window.addEventListener(
    "pagehide",
    () => {
      bootObserver.disconnect();
      widgetResizeObserver?.disconnect();
      if (positionFrame !== undefined) window.cancelAnimationFrame(positionFrame);
      window.clearInterval(weatherTimer);
    },
    { once: true }
  );
  bootWidgets();
  weatherTimer = window.setInterval(() => {
    render();
    if (
      weatherState.enabled &&
      weatherState.data &&
      !loading &&
      Date.now() - weatherState.data.updatedAt >= STALE_AFTER_MS
    ) {
      updateWeather();
    }
  }, 60000);
})();
