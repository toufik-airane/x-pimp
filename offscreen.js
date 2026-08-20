(function startOffscreenAudio() {
  "use strict";

  const PLAY_MESSAGE = "x-pimp-play-hourly-bell";
  const STOP_MESSAGE = "x-pimp-stop-hourly-bell";
  const audio = new Audio(chrome.runtime.getURL("assets/audio/hourly-bell.mp3"));
  audio.preload = "auto";

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === PLAY_MESSAGE) {
      audio.pause();
      audio.currentTime = 0;
      void audio.play().catch((error) => {
        console.error("x-pimp could not play the hourly bell", error);
      });
    } else if (message?.type === STOP_MESSAGE) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
})();
