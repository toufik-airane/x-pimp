(function startBackground() {
  "use strict";

  const ENABLED_KEY = "hourlyBellEnabled";
  const ALARM_NAME = "x-pimp-hourly-bell";
  const PLAY_MESSAGE = "x-pimp-play-hourly-bell";
  const STOP_MESSAGE = "x-pimp-stop-hourly-bell";
  const PREVIEW_MESSAGE = "x-pimp-preview-hourly-bell";
  const OFFSCREEN_DOCUMENT_PATH = "offscreen.html";
  const HOUR_MS = 60 * 60 * 1000;
  let offscreenCreation;

  function getNextHour(timestamp = Date.now()) {
    return (Math.floor(timestamp / HOUR_MS) + 1) * HOUR_MS;
  }

  function runSafely(task, action) {
    void task.catch((error) => {
      console.error(`x-pimp could not ${action}`, error);
    });
  }

  async function syncAlarm() {
    const result = await chrome.storage.local.get(ENABLED_KEY);
    if (result[ENABLED_KEY] === true) {
      await chrome.alarms.create(ALARM_NAME, {
        periodInMinutes: 60,
        when: getNextHour()
      });
      return;
    }

    await chrome.alarms.clear(ALARM_NAME);
  }

  function getOffscreenContexts() {
    return chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
      documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
    });
  }

  async function ensureOffscreenDocument() {
    const contexts = await getOffscreenContexts();
    if (contexts.length > 0) return;

    if (!offscreenCreation) {
      offscreenCreation = chrome.offscreen
        .createDocument({
          url: OFFSCREEN_DOCUMENT_PATH,
          reasons: ["AUDIO_PLAYBACK"],
          justification: "Play the user-enabled hourly singing-bowl bell."
        })
        .finally(() => {
          offscreenCreation = undefined;
        });
    }
    await offscreenCreation;
  }

  async function playBell() {
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage({ type: PLAY_MESSAGE });
  }

  async function stopBell() {
    const contexts = await getOffscreenContexts();
    if (contexts.length > 0) {
      await chrome.runtime.sendMessage({ type: STOP_MESSAGE });
    }
  }

  chrome.runtime.onInstalled.addListener(() => {
    runSafely(syncAlarm(), "schedule the hourly bell");
  });

  chrome.runtime.onStartup.addListener(() => {
    runSafely(syncAlarm(), "restore the hourly bell");
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[ENABLED_KEY]) {
      runSafely(syncAlarm(), "update the hourly bell");
      if (changes[ENABLED_KEY].newValue !== true) {
        runSafely(stopBell(), "stop the hourly bell");
      }
    }
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM_NAME) return;
    runSafely(
      chrome.storage.local.get(ENABLED_KEY).then((result) => {
        if (result[ENABLED_KEY] === true) return playBell();
      }),
      "play the hourly bell"
    );
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === PREVIEW_MESSAGE) {
      runSafely(playBell(), "play the bell preview");
    }
  });

  runSafely(syncAlarm(), "initialize the hourly bell");
})();
