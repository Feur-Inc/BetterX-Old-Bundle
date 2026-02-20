// ─── Footer Badge ─────────────────────────────────────────────────────────────
// Injects a small "Powered by BetterX" badge into X.com's footer area.

const FOOTER_ID = "betterx-footer-badge";

const FOOTER_SELECTORS = [
  '[data-testid="BottomBar"]',
  'footer',
  '[role="contentinfo"]',
];

function findFooter(): Element | null {
  for (const sel of FOOTER_SELECTORS) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function buildBadge(onClick: (() => void) | undefined): HTMLElement {
  const badge = document.createElement("div");
  badge.id = FOOTER_ID;

  badge.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
    </svg>
    <span>BetterX</span>
  `;

  if (onClick) {
    badge.style.cursor = "pointer";
    badge.addEventListener("click", onClick);
  }

  return badge;
}

export function injectFooterBadge(onClick?: () => void): void {
  if (document.getElementById(FOOTER_ID)) return;

  const footer = findFooter();
  if (!footer) return;

  footer.appendChild(buildBadge(onClick));
}

export function removeFooterBadge(): void {
  document.getElementById(FOOTER_ID)?.remove();
}

/** Re-inject footer badge if removed by SPA navigation. */
export function watchFooterBadge(onClick?: () => void): () => void {
  const observer = new MutationObserver(() => {
    if (!document.getElementById(FOOTER_ID)) {
      injectFooterBadge(onClick);
    }
  });

  observer.observe(document.body, { childList: true });
  return () => observer.disconnect();
}
