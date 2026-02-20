// ─── Accent Color ─────────────────────────────────────────────────────────────
// Reads X.com's dynamic accent color and injects it as a CSS variable.

const ACCENT_CSS_ID = "betterx-accent-color";

/** Detect X.com's current accent color from its CSS variables or background colors. */
export function detectAccentColor(): string {
  // Try reading from X.com's own CSS variable
  const root = getComputedStyle(document.documentElement);
  const xAccent = root.getPropertyValue("--color-brand-blue").trim();
  if (xAccent) return xAccent;

  // Fallback: try to read from a prominent element
  const brandEl = document.querySelector('[data-testid="AppTabBar_Home_Link"] svg path');
  if (brandEl) {
    const computed = getComputedStyle(brandEl as Element);
    const fill = computed.fill;
    if (fill && fill !== "none") return fill;
  }

  // Default blue
  return "#1d9bf0";
}

/** Detect if dark mode is active on X.com. */
export function detectThemeMode(): "dark" | "light" | "dim" {
  const html = document.documentElement;
  const bg = getComputedStyle(html).getPropertyValue("--color-background").trim();

  // X.com sets background to black (#000) in Lights Out mode, dark gray in dim
  if (bg === "#000000" || bg === "rgb(0, 0, 0)") return "dark";
  if (bg && bg !== "#ffffff" && bg !== "rgb(255, 255, 255)") return "dim";
  return "light";
}

/** Apply detected accent color as --betterx-accentColor CSS variable. */
export function applyAccentColor(): void {
  const color = detectAccentColor();
  let style = document.getElementById(ACCENT_CSS_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = ACCENT_CSS_ID;
    document.head.appendChild(style);
  }
  style.textContent = `:root { --betterx-accentColor: ${color}; }`;
}

/** Start watching for accent color changes (X.com can change it dynamically). */
export function watchAccentColor(callback: (color: string) => void): () => void {
  let lastColor = detectAccentColor();

  const observer = new MutationObserver(() => {
    const current = detectAccentColor();
    if (current !== lastColor) {
      lastColor = current;
      callback(current);
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  return () => observer.disconnect();
}
