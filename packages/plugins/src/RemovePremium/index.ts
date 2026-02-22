import { definePlugin, Devs } from "@betterx/core";

const SELECTORS = [
  'a[href="/i/premium_sign_up"]',
  'a[href="/i/verified-orgs-signup"]',
  'a[href="/i/monetization"]',
  'a[href^="https://ads.x.com/?"]',
  'a[href="/i/premium_sign_up?referring_page=settings"]',
  'a[href="/jobs"]',
  'aside[aria-label*="Premium"][role="complementary"]',
  '[aria-label="Subscribe to Premium"]',
  'a[href="/i/jf/creators/studio"]',
  '[aria-label="Creator Studio"]',
  'div[data-testid="inlinePrompt"]',
  'a[href="/i/account_analytics"]',
];

let observer: MutationObserver | null = null;

export default definePlugin({
  name: "RemovePremium",
  description: "Remove all premium elements from the interface",
  authors: [Devs.TPM28],

  start() {
    const removeElements = (): void => {
      for (const selector of SELECTORS) {
        document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
          const parent = el.closest<HTMLElement>(".r-1ifxtd0");
          const target = parent ?? el;
          target.style.display = "none";
          target.style.width = "0px";
          target.style.height = "0px";
        });
      }

      document.querySelectorAll<HTMLElement>(".r-1ifxtd0").forEach((el) => {
        if (el.textContent?.includes("Access your post analytics")) {
          el.style.display = "none";
          el.style.width = "0px";
          el.style.height = "0px";
        }
      });

      document.querySelectorAll<HTMLElement>('[role="complementary"].r-eqz5dr').forEach((el) => {
        if (!el.querySelector("ul")) {
          const target = el.parentElement ?? el;
          target.style.display = "none";
          target.style.width = "0px";
          target.style.height = "0px";
        }
      });
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
