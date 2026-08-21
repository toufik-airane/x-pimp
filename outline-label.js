(function defineOutlineLabels(global) {
  "use strict";

  const MAX_LABEL_WORDS = 5;
  const MAX_LABEL_CHARACTERS = 48;
  const ARTICLE_TITLE_SELECTORS = [
    '[data-testid="twitterArticleReadView"] h1',
    '[data-testid="twitterArticleReadView"] [role="heading"]',
    '[data-testid="articleTitle"]',
    '[data-testid="card.layoutLarge.media"] [role="heading"]',
    '[data-testid="card.layoutLarge.media"] h1',
    '[data-testid="card.layoutLarge.media"] h2',
    '[data-testid="card.layoutLarge.media"] h3'
  ];

  function normalizeLabelText(value) {
    return value?.replace(/\s+/g, " ").trim() ?? "";
  }

  function getArticleTitle(article) {
    for (const selector of ARTICLE_TITLE_SELECTORS) {
      const title = normalizeLabelText(article.querySelector(selector)?.textContent);
      if (title) return title;
    }

    const articleCard = article.querySelector(
      '[data-testid="twitterArticleReadView"], [data-testid="card.layoutLarge.media"]'
    );
    if (!articleCard) return "";

    const candidates = [
      ...articleCard.querySelectorAll('[dir="auto"], [dir="ltr"]')
    ]
      .map((element) => normalizeLabelText(element.textContent))
      .filter(
        (text, index, values) =>
          text.length >= 8 &&
          /\s/.test(text) &&
          !/^https?:\/\//i.test(text) &&
          !/^(x|twitter)\.com$/i.test(text) &&
          values.indexOf(text) === index
      );
    return candidates[0] ?? "";
  }

  function getAnchorLabel(article, anchorNumber) {
    const articleTitle = getArticleTitle(article);
    if (articleTitle) return articleTitle;

    const postText = normalizeLabelText(
      article.querySelector('[data-testid="tweetText"]')?.textContent
    );
    if (!postText) return `Media post ${anchorNumber}`;

    const words = postText.split(" ");
    const firstWords = words.slice(0, MAX_LABEL_WORDS).join(" ");
    const clipped = firstWords.slice(0, MAX_LABEL_CHARACTERS).trimEnd();
    return words.length > MAX_LABEL_WORDS || firstWords.length > clipped.length
      ? `${clipped}…`
      : clipped;
  }

  global.X_ZEN_OUTLINE_LABELS = Object.freeze({ getAnchorLabel });
})(globalThis);
