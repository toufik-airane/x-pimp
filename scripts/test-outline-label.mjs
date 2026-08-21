import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(
  new URL("../outline-label.js", import.meta.url),
  "utf8"
);
const context = vm.createContext({ globalThis: {} });
vm.runInContext(source, context);
const { getAnchorLabel } = context.globalThis.X_ZEN_OUTLINE_LABELS;

function createArticle(selectors = {}, cardCandidates = []) {
  const articleCard = {
    querySelectorAll() {
      return cardCandidates.map((textContent) => ({ textContent }));
    }
  };
  return {
    querySelector(selector) {
      if (selector.includes(",")) return cardCandidates.length ? articleCard : null;
      return selectors[selector]
        ? { textContent: selectors[selector] }
        : null;
    }
  };
}

const exampleTitle = "I'm Worried About a Prompt Injection Worm";
assert.equal(
  getAnchorLabel(
    createArticle({ '[data-testid="articleTitle"]': exampleTitle }),
    1
  ),
  exampleTitle,
  "X article labels must use the complete visible title"
);
assert.equal(
  getAnchorLabel(createArticle({}, [exampleTitle, "x.com"]), 1),
  exampleTitle,
  "article card text must provide a title fallback"
);
assert.equal(
  getAnchorLabel(
    createArticle({
      '[data-testid="tweetText"]': "One two three four five six"
    }),
    2
  ),
  "One two three four five…"
);
assert.equal(getAnchorLabel(createArticle(), 3), "Media post 3");

console.log("x-zen outline label tests passed.");
