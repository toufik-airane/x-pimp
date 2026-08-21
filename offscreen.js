(function startOffscreenAudio() {
  "use strict";

  const PLAY_MESSAGE = "x-zen-play-hourly-bell";
  const STOP_MESSAGE = "x-zen-stop-hourly-bell";
  const ENABLED_KEY = "hourlyBellEnabled";
  const audio = new Audio(chrome.runtime.getURL("assets/audio/hourly-bell.mp3"));
  audio.preload = "auto";
  let soundStateRevision = 0;

  function stopAudio() {
    audio.pause();
    audio.currentTime = 0;
  }

  async function playIfEnabled() {
    const requestedRevision = soundStateRevision;
    const result = await chrome.storage.local.get(ENABLED_KEY);
    if (
      result[ENABLED_KEY] !== true ||
      requestedRevision !== soundStateRevision
    ) {
      stopAudio();
      return;
    }

    stopAudio();
    await audio.play();
    if (requestedRevision !== soundStateRevision) stopAudio();
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === PLAY_MESSAGE) {
      void playIfEnabled().catch((error) => {
        console.error("x-zen could not play the hourly bell", error);
      });
    } else if (message?.type === STOP_MESSAGE) {
      stopAudio();
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[ENABLED_KEY]) return;
    soundStateRevision += 1;
    if (changes[ENABLED_KEY].newValue !== true) stopAudio();
  });
})();
