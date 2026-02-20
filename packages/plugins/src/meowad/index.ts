import { definePlugin, Devs } from "@betterx/core";

const CAT_NAMES = ["Whiskers", "Mittens", "Luna", "Simba", "Nala", "Tiger", "Shadow"];
const CAT_IMAGES = [
  "https://cataas.com/cat?width=400&height=300",
  "https://cataas.com/cat/cute?width=400&height=300",
];

let meowadInterval: ReturnType<typeof setInterval> | null = null;

export default definePlugin({
  name: "MeowAd",
  description: "Replaces ads with cute cat content",
  authors: [Devs.Mopi],

  start() {
    const replaceAds = (): void => {
      document
        .querySelectorAll<HTMLElement>('[data-testid="placementTracking"]')
        .forEach((ad) => {
          if (ad.dataset["meowed"]) return;
          ad.dataset["meowed"] = "1";

          const name = CAT_NAMES[Math.floor(Math.random() * CAT_NAMES.length)] ?? "Cat";
          const img = CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)] ?? CAT_IMAGES[0];

          // Replace avatar images
          ad.querySelectorAll<HTMLImageElement>("img").forEach((imgEl) => {
            imgEl.src = img ?? "";
          });

          // Replace "Promoted" text with cat name
          const walker = document.createTreeWalker(ad, NodeFilter.SHOW_TEXT);
          let node: Node | null;
          while ((node = walker.nextNode())) {
            const text = (node as Text).textContent?.trim();
            if (text === "Ad" || text === "Promoted") {
              (node as Text).textContent = `🐱 ${name}`;
            }
          }
        });
    };

    meowadInterval = setInterval(replaceAds, 1000);
    replaceAds();
  },

  stop() {
    if (meowadInterval) {
      clearInterval(meowadInterval);
      meowadInterval = null;
    }
  },
});
