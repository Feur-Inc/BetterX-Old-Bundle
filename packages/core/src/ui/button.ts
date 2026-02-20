// ─── BetterX Nav Button ───────────────────────────────────────────────────────
// Injects the BetterX button into X.com's navigation sidebar.

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
 * Measure the home link's width — in compact mode it's just the icon (~40-60px),
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

function buildButton(onClick: OnClickFn, logoUrl: string): HTMLElement {
  const li = document.createElement("li");
  li.id = BUTTON_ID;

  const btn = document.createElement("div");
  btn.className = "betterx-nav-button";
  btn.setAttribute("role", "button");
  btn.setAttribute("tabindex", "0");
  btn.setAttribute("aria-label", "BetterX");
  btn.setAttribute("title", "BetterX");
  const iconHtml = logoUrl
    ? `<img class="betterx-nav-icon" src="${logoUrl}" alt="BetterX" />`
    : "";
  btn.innerHTML = `${iconHtml}<span class="betterx-nav-label">BetterX</span>`;

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
  // Observe document.documentElement — the nav element itself may not resize.
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
 * Watch for SPA navigation removing the nav button and re-inject it.
 * Uses MutationObserver on document.body (childList only, no subtree) for efficiency.
 */
export function watchNavButton(onClick: OnClickFn, logoUrl: string): () => void {
  const observer = new MutationObserver(() => {
    if (!document.getElementById(BUTTON_ID)) {
      injectNavButton(onClick, logoUrl);
    }
  });

  observer.observe(document.body, { childList: true });
  return () => observer.disconnect();
}
