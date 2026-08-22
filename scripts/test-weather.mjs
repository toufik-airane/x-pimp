import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../weather.js", import.meta.url), "utf8");
let fetchCalls = 0;
let geolocationSuccess;
let storageChangeListener;
let storageWrites = 0;

const context = {
  Date,
  MutationObserver: class MutationObserver {
    observe() {}
    disconnect() {}
  },
  ResizeObserver: class ResizeObserver {
    observe() {}
    disconnect() {}
  },
  URLSearchParams,
  chrome: {
    storage: {
      local: {
        async get() {
          return {
            weather: {
              data: {
                apparentTemperature: 10,
                high: 12,
                low: 7,
                temperature: 11,
                updatedAt: 0,
                weatherCode: 1
              },
              enabled: true
            }
          };
        },
        async remove() {},
        async set() {
          storageWrites += 1;
        }
      },
      onChanged: {
        addListener(listener) {
          storageChangeListener = listener;
        }
      }
    }
  },
  document: {
    body: null,
    documentElement: {},
    querySelector() {
      return null;
    }
  },
  fetch: async () => {
    fetchCalls += 1;
    throw new Error("A cancelled weather request must not fetch");
  },
  navigator: {
    geolocation: {
      getCurrentPosition(success) {
        geolocationSuccess = success;
      }
    }
  },
  window: {
    addEventListener() {},
    cancelAnimationFrame() {},
    clearInterval() {},
    innerHeight: 800,
    requestAnimationFrame() {
      return 1;
    },
    setInterval() {
      return 1;
    }
  }
};

vm.runInNewContext(source, context);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(typeof geolocationSuccess, "function");
assert.equal(typeof storageChangeListener, "function");

storageChangeListener({ weather: { newValue: undefined } }, "local");
geolocationSuccess({ coords: { latitude: 48.86, longitude: 2.35 } });
await new Promise((resolve) => setImmediate(resolve));

assert.equal(fetchCalls, 0);
assert.equal(storageWrites, 0);
console.log("x-zen weather race tests passed.");
