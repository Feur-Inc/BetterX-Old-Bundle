import { definePlugin, Devs } from "@betterx/core";

type RemovedElement = {
  element: Element;
  parent: Node;
  nextSibling: Node | null;
};

let noTrendingObserver: MutationObserver | null = null;
let noTrendingRemoved: RemovedElement[] = [];

export default definePlugin({
  name: "NoTrending",
  description: "Removes trending sections from your feed and explore page",
  authors: [Devs.Mopi],

  start() {
    const removeTrending = (): void => {
      // Trending sidebar
      document
        .querySelectorAll('div[data-testid="sidebarColumn"] section[aria-labelledby]')
        .forEach((section) => {
          if (section.querySelector('h1[dir="auto"][role="heading"]') && section.parentNode) {
            const { parentNode, nextSibling } = section;
            parentNode.removeChild(section);
            noTrendingRemoved.push({ element: section, parent: parentNode, nextSibling });
          }
        });

      // Explore trending
      const explore = document.querySelector('div[aria-label^="Timeline:"][role="region"]');
      if (explore?.parentNode) {
        const { parentNode, nextSibling } = explore;
        parentNode.removeChild(explore);
        noTrendingRemoved.push({ element: explore, parent: parentNode, nextSibling });
      }

      // "Trends for you"
      const trends = document.querySelector('div[aria-label][role="region"]');
      if (trends?.parentNode) {
        const { parentNode, nextSibling } = trends;
        parentNode.removeChild(trends);
        noTrendingRemoved.push({ element: trends, parent: parentNode, nextSibling });
      }
    };

    removeTrending();
    noTrendingObserver = new MutationObserver(removeTrending);
    noTrendingObserver.observe(document.body, { childList: true, subtree: true });
  },

  stop() {
    noTrendingObserver?.disconnect();
    noTrendingObserver = null;

    for (const { element, parent, nextSibling } of noTrendingRemoved) {
      if (nextSibling) {
        parent.insertBefore(element, nextSibling);
      } else {
        (parent as Element).appendChild(element);
      }
    }
    noTrendingRemoved = [];
  },
});
