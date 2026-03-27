import { Devs, definePlugin } from "@betterx/core";

const GOOGLE_GSI_SELECTOR = 'iframe[src*="accounts.google.com/gsi/"]';

let observer: MutationObserver | null = null;

function normalizeIframe(iframe: HTMLIFrameElement): void {
  let url: URL;
  try {
    url = new URL(iframe.src);
  } catch {
    return;
  }

  if (!url.hostname.endsWith("accounts.google.com")) return;
  if (!url.pathname.startsWith("/gsi/")) return;

  const current = url.searchParams.get("is_fedcm_supported");
  if (current === "false") return;

  url.searchParams.set("is_fedcm_supported", "false");
  iframe.src = url.toString();
}

function scan(): void {
  for (const iframe of document.querySelectorAll<HTMLIFrameElement>(GOOGLE_GSI_SELECTOR)) {
    normalizeIframe(iframe);
  }
}

function boot(): void {
  if (!document.body) {
    window.setTimeout(boot, 0);
    return;
  }

  scan();
  observer = new MutationObserver(() => scan());
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"],
  });
}

export default definePlugin({
  name: "WebView Login Bridge",
  description: "Keeps the X login flow working in Android WebView.",
  authors: [Devs.TPM28],
  hidden: true,
  platform: "android",

  start() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => window.setTimeout(boot, 0), {
        once: true,
      });
    } else {
      boot();
    }
  },

  stop() {
    observer?.disconnect();
    observer = null;
  },
});
