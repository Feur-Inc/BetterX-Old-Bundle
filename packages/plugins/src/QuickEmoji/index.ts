import { definePlugin, Devs } from "@betterx/core";

// Type-only import for node-emoji
type EmojiModule = { get: (name: string) => string | undefined; which: (emoji: string) => string | undefined };
let emoji: EmojiModule | null = null;

let quickEmojiPreview: HTMLDivElement | null = null;
let quickEmojiCleanup: (() => void)[] = [];

function attachEmoji(el: HTMLElement): void {
  const preview = document.createElement("div");
  preview.style.cssText = `
    position:absolute;background:#1e1e2e;border:1px solid #3a3a52;border-radius:8px;
    padding:8px;z-index:10000;display:none;max-width:200px;
    font-size:14px;color:#e0e0f0;
  `;
  el.parentElement?.appendChild(preview);
  quickEmojiPreview = preview;

  const onInput = (): void => {
    const text = el.textContent ?? "";
    const match = text.match(/:([a-z_]{2,})$/);
    if (!match || !match[1] || !emoji) {
      preview.style.display = "none";
      return;
    }
    const query = match[1];
    const found = emoji.get(query);
    if (found) {
      preview.textContent = `${found} :${query}:`;
      preview.style.display = "block";
    } else {
      preview.style.display = "none";
    }
  };

  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key !== "Tab") return;
    const text = el.textContent ?? "";
    const match = text.match(/:([a-z_]{2,})$/);
    if (!match || !match[1] || !emoji) return;
    const replacement = emoji.get(match[1]);
    if (!replacement) return;
    e.preventDefault();
    // Replace the :name: trigger with the emoji
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;
    const content = node.textContent ?? "";
    const colonIdx = content.lastIndexOf(":");
    if (colonIdx === -1) return;
    node.textContent = content.slice(0, colonIdx) + replacement + " ";
    const newRange = document.createRange();
    newRange.setStart(node, colonIdx + replacement.length + 1);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    preview.style.display = "none";
  };

  el.addEventListener("input", onInput);
  el.addEventListener("keydown", onKeydown);
  quickEmojiCleanup.push(() => {
    el.removeEventListener("input", onInput);
    el.removeEventListener("keydown", onKeydown);
    preview.remove();
  });
}

export default definePlugin({
  name: "QuickEmoji",
  description: "Enables Discord-style :emoji: syntax in tweet composer",
  authors: [Devs.Mopi],

  start() {
    // Lazy-load node-emoji
    import("node-emoji").then((mod) => {
      emoji = mod as unknown as EmojiModule;
    }).catch(() => undefined);

    const tryInit = (): void => {
      const composer = document.querySelector<HTMLElement>('[data-testid="tweetTextarea_0"]');
      if (!composer || composer.dataset["bxEmoji"]) return;
      composer.dataset["bxEmoji"] = "1";
      attachEmoji(composer);
    };

    const observer = new MutationObserver(tryInit);
    observer.observe(document.body, { childList: true, subtree: true });
    quickEmojiCleanup.push(() => observer.disconnect());
    tryInit();
  },

  stop() {
    for (const fn of quickEmojiCleanup) fn();
    quickEmojiCleanup = [];
    quickEmojiPreview?.remove();
    quickEmojiPreview = null;
    document.querySelectorAll<HTMLElement>('[data-testid="tweetTextarea_0"]').forEach((el) => {
      delete el.dataset["bxEmoji"];
    });
  },
});
