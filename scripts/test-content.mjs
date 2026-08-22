import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const contentSource = await readFile(
  new URL("../content.js", import.meta.url),
  "utf8"
);

async function runHomeClick({ pathname = "/home", pendingPosts }) {
  let documentClickHandler;
  let homeClicks = 0;
  let reloads = 0;
  const observerCallbacks = new Set();

  const pendingPostsButton = {
    click() {}
  };
  function createPendingPostsLabel() {
    return {
      closest(selector) {
        assert.equal(selector, 'button, [role="button"]');
        return pendingPostsButton;
      }
    };
  }
  let pendingPostsLabel =
    pendingPosts === true ? createPendingPostsLabel() : null;
  const homeLink = {
    dataset: {},
    click() {
      homeClicks += 1;
      if (pendingPosts === "after-home-click" && !pendingPostsLabel) {
        pendingPostsLabel = createPendingPostsLabel();
        for (const callback of observerCallbacks) callback();
      }
    }
  };
  const documentElement = {
    dataset: {},
    style: { setProperty() {} }
  };
  const document = {
    body: null,
    documentElement,
    addEventListener(type, handler) {
      if (type === "click") documentClickHandler = handler;
    },
    querySelector(selector) {
      if (selector.includes('data-testid="pillLabel"')) {
        return pendingPostsLabel;
      }
      if (selector.includes("AppTabBar_Home_Link")) return homeLink;
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };
  const window = {
    addEventListener() {},
    cancelAnimationFrame() {},
    clearInterval() {},
    clearTimeout() {},
    requestAnimationFrame() {
      return 1;
    },
    setInterval() {
      return 1;
    },
    setTimeout() {
      return 1;
    }
  };
  const chrome = {
    runtime: { getURL: (path) => `chrome-extension://test/${path}` },
    storage: {
      local: {
        get: async () => ({}),
        set: async () => {}
      },
      onChanged: { addListener() {} },
      sync: { get: async () => ({}) }
    }
  };
  class MutationObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe() {
      observerCallbacks.add(this.callback);
    }
  }

  vm.runInNewContext(contentSource, {
    Element: class Element {},
    MutationObserver,
    chrome,
    document,
    globalThis: {
      X_ZEN: {
        defaults: {},
        sanitize: (value) => ({
          feedWidth: 720,
          hideRightRail: true,
          ...value
        }),
        storageKey: "settings"
      }
    },
    location: {
      assign() {},
      pathname,
      reload() {
        reloads += 1;
      }
    },
    window
  });

  assert.equal(typeof documentClickHandler, "function");
  let prevented = false;
  let stopped = false;
  documentClickHandler({
    altKey: false,
    button: 0,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault() {
      prevented = true;
    },
    stopImmediatePropagation() {
      stopped = true;
    },
    target: {
      closest(selector) {
        return selector.includes("AppTabBar_Home_Link") ? homeLink : null;
      }
    }
  });
  await new Promise((resolve) => setImmediate(resolve));

  return { homeClicks, prevented, reloads, stopped };
}

assert.deepEqual(await runHomeClick({ pendingPosts: true }), {
  homeClicks: 1,
  prevented: true,
  reloads: 0,
  stopped: true
});
assert.deepEqual(await runHomeClick({ pendingPosts: false }), {
  homeClicks: 1,
  prevented: true,
  reloads: 0,
  stopped: true
});
assert.deepEqual(await runHomeClick({ pendingPosts: "after-home-click" }), {
  homeClicks: 2,
  prevented: true,
  reloads: 0,
  stopped: true
});
assert.deepEqual(
  await runHomeClick({ pathname: "/notifications", pendingPosts: true }),
  {
    homeClicks: 1,
    prevented: true,
    reloads: 0,
    stopped: true
  }
);

console.log("content refresh tests passed.");
