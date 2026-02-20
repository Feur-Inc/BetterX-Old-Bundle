// ─── BetterX Nav Button ───────────────────────────────────────────────────────
// Injects the BetterX button into X.com's navigation sidebar.

type OnClickFn = () => void;

const BUTTON_ID = "betterx-nav-btn";

const BETTERX_ICON_SVG = `
<svg class="betterx-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/>
  <path d="M8 12h8M12 8v8" stroke="white" stroke-width="2.5"/>
</svg>`.trim();

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

function buildButton(onClick: OnClickFn): HTMLElement {
  const li = document.createElement("li");
  li.id = BUTTON_ID;

  const btn = document.createElement("div");
  btn.className = "betterx-nav-button";
  btn.setAttribute("role", "button");
  btn.setAttribute("tabindex", "0");
  btn.innerHTML = `${BETTERX_ICON_SVG}<span class="betterx-nav-label">BetterX</span>`;

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

export function injectNavButton(onClick: OnClickFn): void {
  if (document.getElementById(BUTTON_ID)) return;

  const nav = findNavParent();
  if (!nav) return;

  // Find the list or a suitable insertion point
  const list = nav.tagName === "NAV" ? nav.querySelector("ul") ?? nav : nav;
  list.appendChild(buildButton(onClick));
}

export function removeNavButton(): void {
  document.getElementById(BUTTON_ID)?.remove();
}

export function ensureNavButton(onClick: OnClickFn): void {
  if (!document.getElementById(BUTTON_ID)) {
    injectNavButton(onClick);
  }
}

/**
 * Watch for SPA navigation removing the nav button and re-inject it.
 * Uses MutationObserver on document.body (childList only, no subtree) for efficiency.
 */
export function watchNavButton(onClick: OnClickFn): () => void {
  const observer = new MutationObserver(() => {
    if (!document.getElementById(BUTTON_ID)) {
      injectNavButton(onClick);
    }
  });

  observer.observe(document.body, { childList: true });
  return () => observer.disconnect();
}
