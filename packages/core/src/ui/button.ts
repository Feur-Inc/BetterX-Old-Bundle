// ─── BetterX Nav Button ───────────────────────────────────────────────────────
// Injects the BetterX button into X.com's navigation sidebar.

import { BETTERX_LOGO_SVG } from "../utils/constants.js";

type OnClickFn = () => void;

const BUTTON_ID = "betterx-nav-btn";

/** Selector for the X.com primary navigation container. */
const NAV_SELECTORS = [
  'nav[aria-label="Primary"]',
  '[data-testid="AppTabBar_Home_Link"]',
  'a[href="/home"]',
];

function findNavParent(): Element | null {
  for (const sel of NAV_SELECTORS) {
    const el = document.querySelector(sel);
    if (el) return sel === NAV_SELECTORS[0] ? el : el.parentElement;
  }
  return null;
}

/**
 * Check if Twitter's nav is in compact (icon-only) mode.
 * Measure the home link's width - in compact mode it's just the icon (~40-60px),
 * in expanded mode it includes the text label (~180px+).
 */
function isNavCompact(): boolean {
  const homeLink =
    document.querySelector('[data-testid="AppTabBar_Home_Link"]') ??
    document.querySelector('a[href="/home"]');
  if (!homeLink) return false;
  return (homeLink as HTMLElement).offsetWidth < 100;
}

let compactObserver: ResizeObserver | null = null;

function syncCompact(): void {
  const li = document.getElementById(BUTTON_ID);
  if (!li) return;
  li.classList.toggle("betterx-nav-compact", isNavCompact());
}

/**
 * Read the text color X is currently using for nav item labels.
 * X sets this as an inline style on each item's text container - it is NOT
 * inherited from any ancestor - so we must sample it directly from a sibling.
 *
 * We specifically prefer INACTIVE nav items. Active items (e.g. Home when
 * you're on /home) use CSS classes for their colour (potentially the accent
 * colour) rather than an inline style, so sampling them can produce the wrong
 * value. Inactive items always carry an explicit inline `style="color: …"`.
 */
function getNavTextColor(): string {
  const candidates = document.querySelectorAll(
    'nav[aria-label="Primary"] a [dir="ltr"]'
  );
  // Prefer an element that has an inline color - those are always inactive items.
  for (const el of candidates) {
    if ((el as HTMLElement).style.color) {
      return getComputedStyle(el).color;
    }
  }
  // Fallback: first available (e.g. only one nav item rendered so far)
  return candidates[0] ? getComputedStyle(candidates[0]).color : "";
}

function buildButton(onClick: OnClickFn, logoUrl: string): HTMLElement {
  const li = document.createElement("li");
  li.id = BUTTON_ID;

  const btn = document.createElement("div");
  btn.className = "betterx-nav-button";
  btn.setAttribute("role", "button");
  btn.setAttribute("tabindex", "0");
  btn.setAttribute("aria-label", "BetterX");
  btn.setAttribute("title", "BetterX");
  btn.innerHTML = `<span class="betterx-nav-icon">${BETTERX_LOGO_SVG}</span><span class="betterx-nav-label">BetterX</span>`;

  // Mirror X's exact nav text color - X sets this inline per-element, not via
  // inheritance, so CSS `inherit` doesn't work reliably here.
  const navColor = getNavTextColor();
  if (navColor) btn.style.color = navColor;

  btn.addEventListener("click", onClick);
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  });

  li.appendChild(btn);
  return li;
}

export function injectNavButton(onClick: OnClickFn, logoUrl: string): void {
  if (document.getElementById(BUTTON_ID)) return;

  const nav = findNavParent();
  if (!nav) return;

  // Find the list or a suitable insertion point
  const list = nav.tagName === "NAV" ? nav.querySelector("ul") ?? nav : nav;
  list.appendChild(buildButton(onClick, logoUrl));

  // Mirror Twitter's compact (icon-only) mode.
  // Observe document.documentElement - the nav element itself may not resize.
  syncCompact();
  compactObserver?.disconnect();
  compactObserver = new ResizeObserver(() => syncCompact());
  compactObserver.observe(document.documentElement);
}

export function removeNavButton(): void {
  document.getElementById(BUTTON_ID)?.remove();
}

export function ensureNavButton(onClick: OnClickFn, logoUrl: string): void {
  if (!document.getElementById(BUTTON_ID)) {
    injectNavButton(onClick, logoUrl);
  }
}

/**
 * Watch for the nav button being missing (initial render on delegate accounts,
 * SPA navigation removing it, etc.) and inject it whenever it disappears.
 * Uses subtree observation so it catches the nav being rendered anywhere in
 * the DOM, not just direct children of body. RAF-debounced to coalesce the
 * many rapid mutations X produces while loading tweets.
 */
export function watchNavButton(onClick: OnClickFn, logoUrl: string): () => void {
  let rafId = 0;

  const observer = new MutationObserver(() => {
    if (document.getElementById(BUTTON_ID)) return;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      if (!document.getElementById(BUTTON_ID)) {
        injectNavButton(onClick, logoUrl);
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    observer.disconnect();
    if (rafId) cancelAnimationFrame(rafId);
  };
}
