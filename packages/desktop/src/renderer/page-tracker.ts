// ─── Page Tracker ────────────────────────────────────────────────────────────
// Watches URL and DOM changes to update Discord Rich Presence via IPC.

let lastDetails = "";
let lastState = "";

function resolveActivity(): { details: string; state: string } {
  const path = window.location.pathname;
  const search = window.location.search;

  // Home / timeline
  if (path === "/home") {
    return { details: "Browsing X", state: "Home timeline" };
  }

  // Explore
  if (path === "/explore" || path.startsWith("/explore/")) {
    return { details: "Browsing X", state: "Exploring" };
  }

  // Search
  if (path === "/search" || path.startsWith("/search")) {
    const params = new URLSearchParams(search);
    const q = params.get("q");
    return { details: "Searching X", state: q ? `"${q}"` : "" };
  }

  // Notifications
  if (path === "/notifications" || path.startsWith("/notifications/")) {
    return { details: "Browsing X", state: "Notifications" };
  }

  // Messages
  if (path === "/messages" || path.startsWith("/messages/")) {
    return { details: "Browsing X", state: "Messages" };
  }

  // Bookmarks
  if (path === "/i/bookmarks") {
    return { details: "Browsing X", state: "Bookmarks" };
  }

  // Lists
  if (path === "/i/lists" || path.startsWith("/i/lists/")) {
    return { details: "Browsing X", state: "Lists" };
  }

  // Settings
  if (path.startsWith("/settings")) {
    return { details: "Browsing X", state: "Settings" };
  }

  // Profile + subpages (/username, /username/followers, etc.)
  const profileMatch = path.match(/^\/([A-Za-z0-9_]{1,15})(\/.*)?$/);
  if (profileMatch) {
    const username = profileMatch[1];
    const sub = profileMatch[2];

    // Post / status page
    if (sub?.startsWith("/status/")) {
      return { details: "Viewing a post", state: `@${username}` };
    }

    // Profile sub-tabs
    if (sub === "/followers" || sub === "/following" || sub === "/likes" || sub === "/media") {
      return { details: `Viewing @${username}`, state: sub.slice(1).charAt(0).toUpperCase() + sub.slice(2) };
    }

    // Plain profile
    if (!sub || sub === "/") {
      return { details: `Viewing a profile`, state: `@${username}` };
    }
  }

  return { details: "Browsing X", state: "" };
}

function sendUpdate(): void {
  const { details, state } = resolveActivity();
  if (details === lastDetails && state === lastState) return;
  lastDetails = details;
  lastState = state;
  window.electronAPI?.discordRPC?.updateActivity(details, state);
}

export function startPageTracker(): void {
  if (!window.electronAPI?.discordRPC) return;

  // Initial update
  sendUpdate();

  // Poll URL changes (pushState doesn't fire events)
  setInterval(sendUpdate, 2000);

  // Observe DOM mutations (page content swaps) with debounce
  let debounce: ReturnType<typeof setTimeout> | null = null;
  const observer = new MutationObserver(() => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(sendUpdate, 2000);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
