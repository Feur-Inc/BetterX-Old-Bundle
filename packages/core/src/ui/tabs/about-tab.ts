import type { SettingsTab, BetterXContext } from "../tab-registry.js";
import { Devs, BETTERX_VERSION } from "../../utils/constants.js";

// ─── About Tab ────────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

export const AboutTab: SettingsTab = {
  id: "about",
  name: "About",
  priority: 40,

  initialize(container: HTMLElement, ctx: BetterXContext): void {
    container.innerHTML = "";

    const contributors = Object.values(Devs);

    const contributorCards = contributors
      .map(
        (dev) => `
        <a class="betterx-author-badge"
           href="https://x.com/${escHtml(dev.handle)}"
           target="_blank"
           rel="noopener noreferrer">
          <img class="betterx-author-avatar"
               src="https://unavatar.io/twitter/${escHtml(dev.handle)}"
               alt="${escHtml(dev.name)}"
               data-fallback="1">
          <div>
            <div class="betterx-contributor-name">${escHtml(dev.name)}</div>
            <div>@${escHtml(dev.handle)}</div>
          </div>
        </a>
      `
      )
      .join("");

    const html = `
      <div class="betterx-about">
        ${ctx.logoUrl ? `<img class="betterx-about-logo" src="${ctx.logoUrl}" alt="BetterX" />` : ""}
        <h2>BetterX</h2>
        <div class="betterx-about-version">Version ${escHtml(BETTERX_VERSION)}</div>
        <p class="betterx-about-description">
          An open-source enhancement tool for X (formerly Twitter).
          Made with ❤️ by the community.
        </p>

        <div class="betterx-about-contributors-section">
          <h3 class="betterx-about-contributors-title">Contributors</h3>
          <div class="betterx-about-contributors">${contributorCards}</div>
        </div>

        <div class="betterx-about-actions">
          <a href="https://github.com/feur-inc/BetterX"
             target="_blank" rel="noopener noreferrer"
             class="betterx-btn betterx-btn-secondary">
            GitHub
          </a>
        </div>
      </div>
    `;
    container.innerHTML = html;

    // Attach error handlers after setting innerHTML (inline onerror blocked by CSP)
    container.querySelectorAll<HTMLImageElement>("img[data-fallback]").forEach((img) => {
      img.addEventListener("error", () => { img.style.display = "none"; });
    });
  },
};
