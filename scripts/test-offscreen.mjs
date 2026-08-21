import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const listeners = { message: [], storage: [] };
let bellEnabled = false;
let deferNextGet = false;
let resolveDeferredGet;
const calls = { pause: 0, play: 0 };

class AudioMock {
  constructor() {
    this.currentTime = 9;
    this.preload = "";
  }

  pause() {
    calls.pause += 1;
  }

  async play() {
    calls.play += 1;
  }
}

const chrome = {
  runtime: {
    getURL(path) {
      return `chrome-extension://test/${path}`;
    },
    onMessage: {
      addListener(listener) {
        listeners.message.push(listener);
      }
    }
  },
  storage: {
    local: {
      async get() {
        if (deferNextGet) {
          deferNextGet = false;
          return new Promise((resolve) => {
            resolveDeferredGet = resolve;
          });
        }
        return { hourlyBellEnabled: bellEnabled };
      }
    },
    onChanged: {
      addListener(listener) {
        listeners.storage.push(listener);
      }
    }
  }
};
const source = await readFile(new URL("../offscreen.js", import.meta.url), "utf8");
vm.runInContext(source, vm.createContext({ Audio: AudioMock, chrome, console }));

function flushTasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

listeners.message[0]({ type: "x-pimp-play-hourly-bell" });
await flushTasks();
assert.equal(calls.play, 0, "disabled sound must block playback");

bellEnabled = true;
listeners.message[0]({ type: "x-pimp-play-hourly-bell" });
await flushTasks();
assert.equal(calls.play, 1, "enabled sound must allow playback");

bellEnabled = false;
const pausesBeforeDisable = calls.pause;
listeners.storage[0]({ hourlyBellEnabled: { newValue: false } }, "local");
assert.equal(calls.pause, pausesBeforeDisable + 1, "disabling must stop audio");

bellEnabled = true;
deferNextGet = true;
const playsBeforeRace = calls.play;
listeners.message[0]({ type: "x-pimp-play-hourly-bell" });
await flushTasks();
bellEnabled = false;
listeners.storage[0]({ hourlyBellEnabled: { newValue: false } }, "local");
resolveDeferredGet({ hourlyBellEnabled: true });
await flushTasks();
assert.equal(
  calls.play,
  playsBeforeRace,
  "a stale enabled read must not play after sound is disabled"
);

console.log("x-pimp offscreen audio tests passed.");
