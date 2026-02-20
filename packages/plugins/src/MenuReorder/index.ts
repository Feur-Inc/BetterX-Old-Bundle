import { definePlugin, Devs, OptionType } from "@betterx/core";

const STORAGE_KEY = "betterx_menu_order";

let menuReorderObserver: MutationObserver | null = null;
let menuReorderCleanupFns: (() => void)[] = [];

function itemId(item: HTMLElement): string {
  const link = item.querySelector("a");
  return link?.getAttribute("href") ?? item.textContent?.trim() ?? "";
}

function saveOrder(nav: HTMLElement): void {
  const items = Array.from(nav.querySelectorAll<HTMLElement>("li"));
  const order = items.map((item) => itemId(item));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
}

function getSavedOrder(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function setupDragAndDrop(nav: HTMLElement): void {
  const items = Array.from(nav.querySelectorAll<HTMLElement>("li"));
  if (items.length === 0) return;

  const savedOrder = getSavedOrder();

  // Apply saved order
  if (savedOrder.length > 0) {
    const sorted = savedOrder
      .map((id: string) => items.find((item: HTMLElement) => itemId(item) === id))
      .filter((item: HTMLElement | undefined): item is HTMLElement => item !== undefined);
    for (const other of items) {
      if (!sorted.includes(other)) sorted.push(other);
    }
    const parent = nav.querySelector("ul") ?? nav;
    sorted.forEach((item) => parent.appendChild(item));
  }

  let dragged: HTMLElement | null = null;

  for (const item of items) {
    item.setAttribute("draggable", "true");

    const onDragStart = (): void => {
      dragged = item;
      item.style.opacity = "0.5";
    };
    const onDragEnd = (): void => {
      item.style.opacity = "";
      dragged = null;
      saveOrder(nav);
    };
    const onDragOver = (e: DragEvent): void => {
      e.preventDefault();
      if (!dragged || dragged === item) return;
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const parent = item.parentElement;
      if (!parent) return;
      if (e.clientY < midY) {
        parent.insertBefore(dragged, item);
      } else {
        parent.insertBefore(dragged, item.nextSibling);
      }
    };

    item.addEventListener("dragstart", onDragStart);
    item.addEventListener("dragend", onDragEnd);
    item.addEventListener("dragover", onDragOver);

    menuReorderCleanupFns.push(() => {
      item.removeEventListener("dragstart", onDragStart);
      item.removeEventListener("dragend", onDragEnd);
      item.removeEventListener("dragover", onDragOver);
      item.removeAttribute("draggable");
    });
  }
}

export default definePlugin({
  name: "MenuReorder",
  description: "Allows drag-and-drop reordering of navigation menu items",
  authors: [Devs.TPM28, Devs.Mopi],
  requiresRestart: true,
  options: {
    enableReordering: {
      type: OptionType.BOOLEAN,
      default: true,
      description: "Allow menu items to be reordered by drag and drop",
    },
  },

  start() {
    if (!this.settings.store.enableReordering) return;

    const tryInit = (): void => {
      const nav = document.querySelector<HTMLElement>('nav[aria-label="Primary"]');
      if (!nav || nav.dataset["bxReorder"]) return;
      nav.dataset["bxReorder"] = "1";
      setupDragAndDrop(nav);
    };

    menuReorderObserver = new MutationObserver(tryInit);
    menuReorderObserver.observe(document.body, { childList: true, subtree: true });
    setTimeout(tryInit, 500);
  },

  stop() {
    menuReorderObserver?.disconnect();
    menuReorderObserver = null;
    for (const fn of menuReorderCleanupFns) fn();
    menuReorderCleanupFns = [];
    const nav = document.querySelector<HTMLElement>('nav[aria-label="Primary"]');
    if (nav) delete nav.dataset["bxReorder"];
  },
});
