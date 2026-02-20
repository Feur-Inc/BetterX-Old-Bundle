import { definePlugin, Devs, OptionType } from "@betterx/core";

const TWITTER_LOGO = "M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z";
const BLUESKY_LOGO = "m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z";
const X_PATH_SELECTOR = 'path[d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"]';

let btbObservers: MutationObserver[] = [];
let btbStyleEl: HTMLStyleElement | null = null;
let btbBlueskyStyleEl: HTMLStyleElement | null = null;

function findAccentColor(): string {
  const stored = localStorage.getItem("twitter-accent-color");
  const el = document.querySelector<HTMLElement>('div[data-testid="ScrollSnap-List"] div[style*="background-color:"]');
  if (el) {
    const color = getComputedStyle(el).backgroundColor;
    if (color) {
      localStorage.setItem("twitter-accent-color", color);
      return color;
    }
  }
  return stored ?? "rgb(29, 155, 240)";
}

function darkenColor(color: string): string {
  const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!m) return color;
  const [, r, g, b] = m;
  return `rgb(${Math.max(0, Number(r) - 24)},${Math.max(0, Number(g) - 24)},${Math.max(0, Number(b) - 24)})`;
}

function replaceText(selector: string, from: string, to: string): void {
  document.querySelectorAll(selector).forEach((el) => {
    if (el.textContent === from) el.textContent = to;
  });
}

export default definePlugin({
  name: "BringTwitterBack",
  description: "Reverts X branding back to Twitter",
  authors: [Devs.Mopi, Devs.TPM28],
  requiresRestart: true,
  options: {
    accentColorButton: {
      type: OptionType.BOOLEAN,
      default: true,
      description: "Use Twitter's accent color for Tweet buttons",
    },
    useBlueskyLogo: {
      type: OptionType.BOOLEAN,
      default: false,
      description: "Use Bluesky's logo instead of Twitter's",
    },
  },

  start() {
    const store = this.settings.store;

    const styleEl = document.createElement("style");
    document.head.appendChild(styleEl);
    btbStyleEl = styleEl;

    const updateStyles = (): void => {
      if (!store.accentColorButton || !styleEl.sheet) return;
      const color = findAccentColor();
      const hover = darkenColor(color);
      const sheet = styleEl.sheet;
      while (sheet.cssRules.length > 0) sheet.deleteRule(0);
      sheet.insertRule(
        `[data-testid="tweetButtonInline"],[data-testid="SideNav_NewTweet_Button"],[data-testid="tweetButton"]{background-color:${color}!important;}`,
        0
      );
      sheet.insertRule(
        `[data-testid="tweetButtonInline"]:hover,[data-testid="SideNav_NewTweet_Button"]:hover,[data-testid="tweetButton"]:hover{background-color:${hover}!important;}`,
        1
      );
    };

    updateStyles();

    if (store.useBlueskyLogo) {
      const blueskyStyle = document.createElement("style");
      blueskyStyle.textContent = `[data-testid="TopNavHeader"] svg[viewBox="0 0 600 500"]{transform:scale(0.75);}`;
      document.head.appendChild(blueskyStyle);
      btbBlueskyStyleEl = blueskyStyle;
    }

    const updateUI = (): void => {
      const logoPath = document.querySelector<SVGPathElement>(X_PATH_SELECTOR);
      if (logoPath) {
        const svg = logoPath.closest("svg");
        if (svg) {
          if (store.useBlueskyLogo) {
            logoPath.setAttribute("d", BLUESKY_LOGO);
            svg.setAttribute("viewBox", "0 0 600 500");
          } else {
            logoPath.setAttribute("d", TWITTER_LOGO);
            svg.setAttribute("viewBox", "0 0 24 24");
          }
        }
      }

      replaceText('[data-testid="tweetButtonInline"] span:nth-child(2)', "Post", "Tweet");
      replaceText('button[data-testid="tweetButton"] span:nth-child(2)', "Post", "Tweet");
      replaceText('div[data-testid="retweetConfirm"] span', "Repost", "Retweet");

      const title = document.querySelector("title");
      if (title?.textContent?.includes("X")) {
        document.title = title.textContent
          .replace(" / X", " / Twitter")
          .replace(" on X: ", " on Twitter: ")
          .replace(/^X$/, "Twitter");
      }

      updateStyles();
    };

    const observer = new MutationObserver(updateUI);
    observer.observe(document.body, { childList: true, subtree: true });
    btbObservers.push(observer);
    updateUI();
  },

  stop() {
    for (const obs of btbObservers) obs.disconnect();
    btbObservers = [];
    btbStyleEl?.remove();
    btbBlueskyStyleEl?.remove();
    btbStyleEl = null;
    btbBlueskyStyleEl = null;
  },
});
