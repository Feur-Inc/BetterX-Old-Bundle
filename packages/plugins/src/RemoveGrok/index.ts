import { definePlugin, Devs } from "@betterx/core";

const SELECTORS = [
  'a[href="/i/grok"]',
  'a[href*="grok.com/imagine"]',
  '[data-testid="GrokDrawer"]',
  'button[aria-label="Grok actions"]',
  'button[data-testid="grokImgGen"]',
  'button[aria-label="Profile Summary"]',
  'div[role="button"] svg[viewBox="0 0 33 32"]',
  'div.css-175oi2r.r-1777fci.r-1wzrnnt button[role="button"]',
];

let observer: MutationObserver | null = null;

export default definePlugin({
  name: "RemoveGrok",
  description: "Remove all Grok AI elements from the interface",
  authors: [Devs.TPM28],

  start() {
    const removeElements = (): void => {
      for (const selector of SELECTORS) {
        document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
          el.style.display = "none";
          el.style.width = "0px";
          el.style.height = "0px";
        });
      }
    };

    const setup = (): void => {
      removeElements();
      observer = new MutationObserver(removeElements);
      observer.observe(document.body, { childList: true, subtree: true });
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(setup, 400));
    } else {
      setTimeout(setup, 400);
    }
  },

  stop() {
    observer?.disconnect();
    observer = null;
  },
});
