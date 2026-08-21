import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const listeners = {
  alarm: [],
  installed: [],
  message: [],
  startup: [],
  storage: []
};
const calls = {
  alarmCreate: [],
  alarmClearAll: 0,
  messages: [],
  offscreenCreate: 0
};
let bellEnabled = false;
let hasOffscreenDocument = false;

function event(name) {
  return {
    addListener(listener) {
      listeners[name].push(listener);
    }
  };
}

const chrome = {
  alarms: {
    async clearAll() {
      calls.alarmClearAll += 1;
    },
    async create(...args) {
      calls.alarmCreate.push(args);
    },
    onAlarm: event("alarm")
  },
  offscreen: {
    async createDocument() {
      calls.offscreenCreate += 1;
      hasOffscreenDocument = true;
    }
  },
  runtime: {
    async getContexts() {
      return hasOffscreenDocument ? [{}] : [];
    },
    getURL(path) {
      return `chrome-extension://test/${path}`;
    },
    onInstalled: event("installed"),
    onMessage: event("message"),
    onStartup: event("startup"),
    async sendMessage(message) {
      calls.messages.push(message);
    }
  },
  storage: {
    local: {
      async get() {
        return { hourlyBellEnabled: bellEnabled };
      }
    },
    onChanged: event("storage")
  }
};
const fixedNow = Date.UTC(2026, 7, 20, 18, 45);
const background = await readFile(new URL("../background.js", import.meta.url), "utf8");
const context = vm.createContext({
  chrome,
  console,
  Date: { now: () => fixedNow },
  Math
});

function flushTasks() {
  return new Promise((resolve) => setImmediate(resolve));
}

vm.runInContext(background, context);
await flushTasks();
assert.equal(calls.alarmClearAll, 1, "startup must remove obsolete alarms");

listeners.message[0]({ type: "x-zen-preview-hourly-bell" });
await flushTasks();
assert.equal(
  calls.offscreenCreate,
  0,
  "a preview message must not bypass the disabled setting"
);

bellEnabled = true;
listeners.storage[0]({ hourlyBellEnabled: { newValue: true } }, "local");
await flushTasks();
const [alarmName, alarmOptions] = calls.alarmCreate.at(-1);
assert.equal(alarmName, "x-zen-hourly-bell");
assert.equal(alarmOptions.periodInMinutes, 60);
assert.equal(alarmOptions.when, Date.UTC(2026, 7, 20, 19));

listeners.message[0]({ type: "x-zen-preview-hourly-bell" });
await flushTasks();
await flushTasks();
assert.equal(calls.offscreenCreate, 1);
assert.ok(
  calls.messages.some((message) => message.type === "x-zen-play-hourly-bell")
);

bellEnabled = false;
listeners.storage[0]({ hourlyBellEnabled: { newValue: false } }, "local");
await flushTasks();
assert.ok(
  calls.messages.some((message) => message.type === "x-zen-stop-hourly-bell")
);

const playMessagesAfterDisable = calls.messages.filter(
  (message) => message.type === "x-zen-play-hourly-bell"
).length;
listeners.message[0]({ type: "x-zen-preview-hourly-bell" });
listeners.alarm[0]({ name: "x-zen-hourly-bell" });
await flushTasks();
assert.equal(
  calls.messages.filter(
    (message) => message.type === "x-zen-play-hourly-bell"
  ).length,
  playMessagesAfterDisable,
  "disabled preview and alarm events must not play audio"
);

console.log("x-zen background tests passed.");
