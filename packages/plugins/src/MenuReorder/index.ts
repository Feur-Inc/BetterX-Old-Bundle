import { definePlugin, Devs, OptionType } from "@betterx/core";

const STORAGE_KEY = "betterx_menu_order";
const HIDDEN_KEY = "betterx_menu_hidden";

let menuReorderObserver: MutationObserver | null = null;
let menuReorderCleanupFns: (() => void)[] = [];
let menuReorderHidden: string[] = [];

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

function getHiddenItems(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function showContextMenu(e: MouseEvent, item: HTMLElement, nav: HTMLElement): void {
  e.preventDefault();

  document.querySelector(".bx-menu-context")?.remove();

  const menu = document.createElement("div");
  menu.className = "bx-menu-context";
  menu.style.cssText = `position:fixed;top:${e.clientY}px;left:${e.clientX}px;background:var(--betterx-modalBg,#1e1e2e);border:1px solid var(--betterx-borderColor,#3a3a52);border-radius:8px;padding:4px;z-index:10001;min-width:150px;box-shadow:0 8px 24px rgba(0,0,0,0.4);`;

  const makeOption = (label: string, onClick: () => void): HTMLElement => {
    const opt = document.createElement("div");
    opt.textContent = label;
    opt.style.cssText = `padding:7px 12px;cursor:pointer;font-size:14px;color:var(--betterx-textColor,#e0e0f0);border-radius:6px;`;
    opt.addEventListener("mouseenter", () => { opt.style.background = "var(--betterx-hoverBg,#35354a)"; });
    opt.addEventListener("mouseleave", () => { opt.style.background = ""; });
    opt.addEventListener("click", () => {
      menu.remove();
      onClick();
    });
    return opt;
  };

  menu.appendChild(makeOption("Hide this item", () => {
    const id = itemId(item);
    item.style.display = "none";
    if (!menuReorderHidden.includes(id)) {
      menuReorderHidden.push(id);
      localStorage.setItem(HIDDEN_KEY, JSON.stringify(menuReorderHidden));
    }
  }));

  menu.appendChild(makeOption("Reset menu", () => {
    menuReorderHidden = [];
    localStorage.removeItem(HIDDEN_KEY);
    Array.from(nav.querySelectorAll<HTMLElement>("li")).forEach((li) => { li.style.display = ""; });
  }));

  document.body.appendChild(menu);

  const close = (ev: MouseEvent): void => {
    if (!menu.contains(ev.target as Node)) {
      menu.remove();
      document.removeEventListener("click", close, true);
    }
  };
  setTimeout(() => document.addEventListener("click", close, true), 0);
}

function setupDragAndDrop(nav: HTMLElement): void {
  const items = Array.from(nav.querySelectorAll<HTMLElement>("li"));
  if (items.length === 0) return;

  // Restore hidden state
  for (const item of items) {
    if (menuReorderHidden.includes(itemId(item))) {
      item.style.display = "none";
    }
  }

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

    const onContextMenu = (e: MouseEvent): void => showContextMenu(e, item, nav);

    item.addEventListener("dragstart", onDragStart);
    item.addEventListener("dragend", onDragEnd);
    item.addEventListener("dragover", onDragOver);
    item.addEventListener("contextmenu", onContextMenu);

    menuReorderCleanupFns.push(() => {
      item.removeEventListener("dragstart", onDragStart);
      item.removeEventListener("dragend", onDragEnd);
      item.removeEventListener("dragover", onDragOver);
      item.removeEventListener("contextmenu", onContextMenu);
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
    menuReorderHidden = getHiddenItems();

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
    document.querySelector(".bx-menu-context")?.remove();
    const nav = document.querySelector<HTMLElement>('nav[aria-label="Primary"]');
    if (nav) {
      delete nav.dataset["bxReorder"];
      Array.from(nav.querySelectorAll<HTMLElement>("li")).forEach((li) => { li.style.display = ""; });
    }
    menuReorderHidden = [];
  },
});
