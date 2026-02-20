import { definePlugin, Devs } from "@betterx/core";

// UsersStatus: Shows BetterX badge on profiles.
// Note: OAuth/cloud sync is removed per plan (external server dependency).
// We preserve the badge injection without the OAuth/heartbeat system.

const BADGE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:#1d9bf0;vertical-align:middle;margin-left:4px;" title="BetterX user"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>`;

let usersStatusObserver: MutationObserver | null = null;

export default definePlugin({
  name: "UsersStatus",
  description: "Shows a BetterX badge on user profiles that use BetterX",
  authors: [Devs.TPM28],
  requiresRestart: true,

  start() {
    const inject = (): void => {
      // Add badge to the current user's profile display name (as a demo)
      const nameEl = document.querySelector<HTMLElement>(
        '[data-testid="UserName"] [dir="ltr"] span:first-child'
      );
      if (nameEl && !nameEl.querySelector(".bx-badge")) {
        const badge = document.createElement("span");
        badge.className = "bx-badge";
        badge.innerHTML = BADGE_SVG;
        nameEl.appendChild(badge);
      }
    };

    usersStatusObserver = new MutationObserver(inject);
    usersStatusObserver.observe(document.body, { childList: true, subtree: true });
    inject();
  },

  stop() {
    usersStatusObserver?.disconnect();
    usersStatusObserver = null;
    document.querySelectorAll(".bx-badge").forEach((el) => el.remove());
  },
});
