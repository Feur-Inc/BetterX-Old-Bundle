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

  initialize(container: HTMLElement, _ctx: BetterXContext): void {
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
               onerror="this.style.display='none'">
          <div>
            <div style="font-weight:600;color:var(--betterx-textColor)">${escHtml(dev.name)}</div>
            <div>@${escHtml(dev.handle)}</div>
          </div>
        </a>
      `
      )
      .join("");

    container.innerHTML = `
      <div class="betterx-about">
        <svg class="betterx-about-logo" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          <path d="M8 12h8M12 8v8" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        </svg>
        <h2>BetterX</h2>
        <div class="betterx-about-version">Version ${escHtml(BETTERX_VERSION)}</div>
        <p style="color:var(--betterx-textColorSecondary);text-align:center;max-width:400px;font-size:14px;">
          An open-source enhancement tool for X (formerly Twitter).
          Made with ❤️ by the community.
        </p>

        <div style="width:100%;border-top:1px solid var(--betterx-borderColor);padding-top:20px;margin-top:8px;">
          <h3 style="text-align:center;color:var(--betterx-textColor);font-size:16px;margin-bottom:16px;">Contributors</h3>
          <div class="betterx-about-contributors">${contributorCards}</div>
        </div>

        <div style="display:flex;gap:12px;margin-top:16px;">
          <a href="https://github.com/feur-inc/BetterX"
             target="_blank" rel="noopener noreferrer"
             class="betterx-btn betterx-btn-secondary">
            GitHub
          </a>
        </div>
      </div>
    `;
  },
};
