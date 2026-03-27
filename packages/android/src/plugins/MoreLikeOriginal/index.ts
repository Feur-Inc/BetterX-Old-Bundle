import { Devs, definePlugin, injectStyle } from "@betterx/core";

const STYLE_ID = "betterx-more-like-original-style";
const ACTIVE_CLASS = "betterx-more-like-original-active";
const DRAGGING_CLASS = "betterx-more-like-original-dragging";
const PANEL_ATTR = "data-betterx-more-like-original";
const ITEM_CLASS = "r-ubg91z";
const DIALOG_CONTENT_CLASSES = ["r-16y2uox", "r-1wbh5a2", "r-ifefl9", "r-1rnoaur", "r-1r851ge"];

const HORIZONTAL_INTENT_THRESHOLD = 4;
const VISUAL_DEAD_ZONE = 5;
const VERTICAL_CANCEL_THRESHOLD = 24;
const DIRECTION_LOCK_RATIO = 1.15;
const OPEN_SETTLE_PROGRESS_THRESHOLD = 0.14;
const CLOSE_SETTLE_PROGRESS_THRESHOLD = 0.86;
const FLING_VELOCITY_THRESHOLD = 0.14;
const DRAWER_WIDTH_FALLBACK_RATIO = 0.86;

type GesturePhase = "idle" | "pending-open" | "pending-close" | "drag-open" | "drag-close";
type InputKind = "touch" | "mouse";

let observer: MutationObserver | null = null;
let panel: HTMLElement | null = null;
let backdrop: HTMLElement | null = null;

let activePointerId: number | null = null;
let activeInput: InputKind | null = null;
let phase: GesturePhase = "idle";
let menuRequested = false;
let pendingClose = false;
let closeRetryTimeout: number | null = null;

let startX = 0;
let startY = 0;
let lastSampleX = 0;
let lastSampleTime = 0;
let velocityX = 0;
let progress = 0;
let rafId: number | null = null;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isDraggingPhase(value: GesturePhase): boolean {
  return value === "drag-open" || value === "drag-close";
}

function clearCloseRetry(): void {
  if (closeRetryTimeout !== null) {
    clearTimeout(closeRetryTimeout);
    closeRetryTimeout = null;
  }
}

function setProgressVariable(value: number): void {
  document.documentElement.style.setProperty(
    "--betterx-more-like-original-progress",
    String(clamp(value, 0, 1))
  );
}

function setProgress(value: number): void {
  progress = clamp(value, 0, 1);

  if (rafId !== null) return;

  rafId = requestAnimationFrame(() => {
    rafId = null;
    setProgressVariable(progress);
  });
}

function setProgressImmediate(value: number): void {
  progress = clamp(value, 0, 1);

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  setProgressVariable(progress);
}

function setActive(active: boolean): void {
  document.documentElement.classList.toggle(ACTIVE_CLASS, active);
}

function setDragging(dragging: boolean): void {
  document.documentElement.classList.toggle(DRAGGING_CLASS, dragging);
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return (
    target.closest("input, textarea, select, [contenteditable='true'], [role='textbox']") !== null
  );
}

function isExcludedTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (isTextEntryTarget(target)) return true;
  return (
    target.closest(
      'nav[aria-label="Primary"], [data-testid="TopNavBar"], #betterx-modal-overlay, #betterx-modal, .betterx-modal-header, .betterx-modal-body, .betterx-tabs, .betterx-tab, .betterx-modal-close'
    ) !== null
  );
}

function findDrawer(): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>('div[role="dialog"]')) {
    if (el.querySelector('[data-testid="switcher"]')) return el;
    if (el.querySelector('a[href="/account/switch"]')) return el;
    if (el.querySelector('a[href="/logout"]')) return el;
    if (el.querySelector('button[aria-label^="Switch to"]')) return el;
  }
  return null;
}

function findBackdrop(): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>("div.r-11z020y")) {
    if (el.querySelector('div[role="dialog"]')) return el;
  }
  return null;
}

function setBackdropStyle(node: HTMLElement | null): void {
  if (!node) return;
  node.style.setProperty("background-color", "transparent", "important");
  node.style.setProperty("backdrop-filter", "none", "important");
  node.style.setProperty("-webkit-backdrop-filter", "none", "important");
}

function clearBackdropStyle(node: HTMLElement | null): void {
  if (!node) return;
  node.style.removeProperty("background-color");
  node.style.removeProperty("backdrop-filter");
  node.style.removeProperty("-webkit-backdrop-filter");
}

function setDialogStyle(node: HTMLElement | null): void {
  if (!node) return;
  node.classList.remove("r-zmhzs6", "r-14l27qf");
  node.style.setProperty("box-shadow", "none", "important");
  node.style.setProperty("width", "auto", "important");
  node.style.setProperty("min-width", "85%", "important");
  node.style.setProperty("max-width", "90%", "important");
}

function findDialogContent(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;

  for (const child of node.children) {
    if (!(child instanceof HTMLElement)) continue;
    if (DIALOG_CONTENT_CLASSES.every((cls) => child.classList.contains(cls))) {
      return child;
    }
  }

  return null;
}

function setDialogItemStyle(node: HTMLElement | null): void {
  if (!node) return;

  for (const item of node.querySelectorAll<HTMLElement>(`div.${ITEM_CLASS}`)) {
    item.classList.remove(ITEM_CLASS);
    item.style.setProperty("padding-left", "30px", "important");
    item.style.setProperty("padding-right", "15px", "important");
  }
}

function setDialogContentStyle(node: HTMLElement | null): void {
  const content = findDialogContent(node);
  if (!content) return;

  content.style.setProperty("margin-left", "10px", "important");
  content.style.setProperty("margin-top", "10px", "important");
}

function clearDialogContentStyle(node: HTMLElement | null): void {
  const content = findDialogContent(node);
  if (!content) return;

  content.style.removeProperty("margin-left");
  content.style.removeProperty("margin-top");
}

function clearDialogStyle(node: HTMLElement | null): void {
  if (!node) return;
  node.style.removeProperty("box-shadow");
  node.style.removeProperty("width");
  node.style.removeProperty("min-width");
  node.style.removeProperty("max-width");
}

function syncDrawer(): void {
  const nextPanel = findDrawer();
  if (nextPanel !== panel) {
    clearDialogContentStyle(panel);
    clearDialogStyle(panel);
    if (panel) panel.removeAttribute(PANEL_ATTR);
    panel = nextPanel;
    if (panel) panel.setAttribute(PANEL_ATTR, "1");
  }

  const nextBackdrop = panel ? findBackdrop() : null;
  if (nextBackdrop !== backdrop) {
    clearBackdropStyle(backdrop);
    backdrop = nextBackdrop;
  }

  if (!panel) {
    pendingClose = false;
    clearCloseRetry();

    if (phase === "idle") {
      setActive(false);
      setProgressImmediate(0);
    }
    return;
  }

  setDialogStyle(panel);
  setDialogItemStyle(panel);
  setDialogContentStyle(panel);
  setBackdropStyle(backdrop);

  if (pendingClose) {
    setActive(true);
    setProgressImmediate(0);
    return;
  }

  setActive(true);
  if (!isDraggingPhase(phase) && phase === "idle") {
    setProgressImmediate(1);
  }
}

function openMenu(): void {
  if (panel || menuRequested) return;
  menuRequested = true;

  const button = document.querySelector<HTMLElement>(
    '[data-testid="DashButton_ProfileIcon_Link"], button[aria-label^="Profile menu"]'
  );
  button?.click();
}

function closeMenuWithEscape(): void {
  const init = { key: "Escape", code: "Escape", bubbles: true, cancelable: true };
  window.dispatchEvent(new KeyboardEvent("keydown", init));
  document.dispatchEvent(new KeyboardEvent("keydown", init));
  window.dispatchEvent(new KeyboardEvent("keyup", init));
  document.dispatchEvent(new KeyboardEvent("keyup", init));
}

function clickOutsideDrawer(): boolean {
  if (!panel) return false;

  const rect = panel.getBoundingClientRect();
  const x = clamp(
    rect.right + Math.max(24, (window.innerWidth - rect.right) / 2),
    8,
    window.innerWidth - 8
  );
  const y = clamp(rect.top + rect.height / 2, 8, window.innerHeight - 8);
  const target = document.elementFromPoint(x, y);

  if (!(target instanceof Element) || panel.contains(target)) {
    return false;
  }

  const pointerBase = {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    pointerId: 1,
    isPrimary: true,
  };

  const mouseBase = {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    button: 0,
    buttons: 1,
    view: window,
  };

  if (typeof PointerEvent !== "undefined") {
    target.dispatchEvent(new PointerEvent("pointerdown", { ...pointerBase, pointerType: "touch" }));
  }
  target.dispatchEvent(new MouseEvent("mousedown", mouseBase));
  if (typeof PointerEvent !== "undefined") {
    target.dispatchEvent(new PointerEvent("pointerup", { ...pointerBase, pointerType: "touch" }));
  }
  target.dispatchEvent(new MouseEvent("mouseup", { ...mouseBase, buttons: 0 }));
  target.dispatchEvent(new MouseEvent("click", { ...mouseBase, buttons: 0 }));
  return true;
}

function requestCloseMenu(): void {
  pendingClose = true;

  const attemptClose = (): void => {
    if (!pendingClose) return;
    if (!clickOutsideDrawer()) {
      closeMenuWithEscape();
    }
  };

  attemptClose();
  clearCloseRetry();
  closeRetryTimeout = window.setTimeout(() => {
    attemptClose();
    if (pendingClose) {
      closeMenuWithEscape();
    }
  }, 180);
}

function getDrawerWidth(): number {
  if (panel) {
    const width = panel.getBoundingClientRect().width;
    if (width > 0) return width;
  }
  return window.innerWidth * DRAWER_WIDTH_FALLBACK_RATIO;
}

function getOpeningProgress(dx: number): number {
  const width = getDrawerWidth();
  const usableWidth = Math.max(1, width - VISUAL_DEAD_ZONE);
  const effectiveDx = Math.max(0, dx - VISUAL_DEAD_ZONE);
  return clamp(effectiveDx / usableWidth, 0, 1);
}

function getClosingProgress(dx: number): number {
  const width = getDrawerWidth();
  const usableWidth = Math.max(1, width - VISUAL_DEAD_ZONE);
  const effectiveDx = Math.max(0, -dx - VISUAL_DEAD_ZONE);
  return clamp(1 - effectiveDx / usableWidth, 0, 1);
}

function recordMotionSample(x: number): void {
  const now = performance.now();
  const dt = now - lastSampleTime;

  if (dt > 0) {
    velocityX = (x - lastSampleX) / dt;
  }

  lastSampleX = x;
  lastSampleTime = now;
}

function beginGesture(
  target: EventTarget | null,
  x: number,
  y: number,
  input: InputKind,
  id: number
): void {
  if (phase !== "idle") return;
  if (isExcludedTarget(target)) return;

  syncDrawer();

  activeInput = input;
  activePointerId = id;
  startX = x;
  startY = y;
  lastSampleX = x;
  lastSampleTime = performance.now();
  velocityX = 0;
  menuRequested = false;
  pendingClose = false;
  clearCloseRetry();

  phase = panel ? "pending-close" : "pending-open";

  if (panel) {
    setActive(true);
    setProgressImmediate(1);
  }
}

function cancelPendingGesture(): void {
  activeInput = null;
  activePointerId = null;
  phase = "idle";
}

function updateGesture(x: number, y: number, preventDefault: (() => void) | null): void {
  const dx = x - startX;
  const dy = y - startY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (phase === "pending-open") {
    if (absDy > VERTICAL_CANCEL_THRESHOLD && absDy > absDx) {
      cancelPendingGesture();
      return;
    }

    if (dx > HORIZONTAL_INTENT_THRESHOLD && absDx > absDy * DIRECTION_LOCK_RATIO) {
      phase = "drag-open";
      setActive(true);
      setDragging(true);
      openMenu();
    } else {
      return;
    }
  }

  if (phase === "pending-close") {
    if (absDy > VERTICAL_CANCEL_THRESHOLD && absDy > absDx) {
      cancelPendingGesture();
      return;
    }

    if (-dx > HORIZONTAL_INTENT_THRESHOLD && absDx > absDy * DIRECTION_LOCK_RATIO) {
      phase = "drag-close";
      setActive(true);
      setDragging(true);
    } else {
      return;
    }
  }

  recordMotionSample(x);

  if (phase === "drag-open") {
    setProgress(getOpeningProgress(dx));
    preventDefault?.();
    return;
  }

  if (phase === "drag-close") {
    setProgress(getClosingProgress(dx));
    preventDefault?.();
  }
}

function shouldRemainOpen(wasClosing: boolean): boolean {
  if (wasClosing) {
    if (velocityX <= -FLING_VELOCITY_THRESHOLD) return false;
    if (velocityX >= FLING_VELOCITY_THRESHOLD) return true;
    return progress >= CLOSE_SETTLE_PROGRESS_THRESHOLD;
  }

  if (velocityX >= FLING_VELOCITY_THRESHOLD) return true;
  if (velocityX <= -FLING_VELOCITY_THRESHOLD) return false;
  return progress >= OPEN_SETTLE_PROGRESS_THRESHOLD;
}

function finishGesture(): void {
  const wasOpening = phase === "drag-open";
  const wasClosing = phase === "drag-close";

  activeInput = null;
  activePointerId = null;
  phase = "idle";
  setDragging(false);

  if (!wasOpening && !wasClosing) return;

  if (shouldRemainOpen(wasClosing)) {
    pendingClose = false;
    clearCloseRetry();
    setActive(true);
    setProgress(1);
    window.setTimeout(syncDrawer, 120);
    return;
  }

  setActive(true);
  setProgress(0);
  requestCloseMenu();
  window.setTimeout(syncDrawer, 220);
}

function getTouchById(list: TouchList, id: number): Touch | null {
  for (let i = 0; i < list.length; i++) {
    const touch = list.item(i);
    if (touch?.identifier === id) return touch;
  }
  return null;
}

function onTouchStart(event: TouchEvent): void {
  if (event.touches.length !== 1 || phase !== "idle") return;
  const touch = event.touches.item(0);
  if (!touch) return;
  beginGesture(event.target, touch.clientX, touch.clientY, "touch", touch.identifier);
}

function onTouchMove(event: TouchEvent): void {
  if (activeInput !== "touch" || activePointerId === null) return;
  const touch = getTouchById(event.touches, activePointerId);
  if (!touch) return;
  updateGesture(touch.clientX, touch.clientY, () => event.preventDefault());
}

function onTouchEnd(event: TouchEvent): void {
  if (activeInput !== "touch" || activePointerId === null) return;
  const touch = getTouchById(event.changedTouches, activePointerId);
  if (!touch) return;
  recordMotionSample(touch.clientX);
  finishGesture();
}

function onPointerDown(event: PointerEvent): void {
  if (activeInput === "touch") return;
  if (event.pointerType !== "mouse" || event.button !== 0) return;
  beginGesture(event.target, event.clientX, event.clientY, "mouse", event.pointerId);
}

function onPointerMove(event: PointerEvent): void {
  if (activeInput !== "mouse" || activePointerId !== event.pointerId) return;
  updateGesture(event.clientX, event.clientY, null);
}

function onPointerUp(event: PointerEvent): void {
  if (activeInput !== "mouse" || activePointerId !== event.pointerId) return;
  recordMotionSample(event.clientX);
  finishGesture();
}

function boot(): void {
  if (!document.body) {
    window.setTimeout(boot, 0);
    return;
  }

  injectStyle(
    `
:root {
  --betterx-more-like-original-progress: 0;
}
html.${ACTIVE_CLASS} [${PANEL_ATTR}="1"] {
  transform: translate3d(calc((var(--betterx-more-like-original-progress) - 1) * 100%), 0, 0) !important;
  will-change: transform;
  transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1) !important;
}
html.${DRAGGING_CLASS} [${PANEL_ATTR}="1"] {
  transition: none !important;
}
`,
    STYLE_ID
  );

  document.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
  document.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
  document.addEventListener("touchend", onTouchEnd, { passive: true, capture: true });
  document.addEventListener("touchcancel", onTouchEnd, { passive: true, capture: true });

  document.addEventListener("pointerdown", onPointerDown, { passive: true, capture: true });
  document.addEventListener("pointermove", onPointerMove, { passive: true, capture: true });
  document.addEventListener("pointerup", onPointerUp, { passive: true, capture: true });
  document.addEventListener("pointercancel", onPointerUp, { passive: true, capture: true });

  observer = new MutationObserver(syncDrawer);
  observer.observe(document.body, { childList: true, subtree: true });

  syncDrawer();
}

export default definePlugin({
  name: "More like original",
  description: "Open and close the account drawer with smoother horizontal swipe ergonomics.",
  authors: [Devs.TPM28],
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

    document.removeEventListener("touchstart", onTouchStart, true);
    document.removeEventListener("touchmove", onTouchMove, true);
    document.removeEventListener("touchend", onTouchEnd, true);
    document.removeEventListener("touchcancel", onTouchEnd, true);

    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("pointercancel", onPointerUp, true);

    if (panel) panel.removeAttribute(PANEL_ATTR);
    clearDialogContentStyle(panel);
    clearDialogStyle(panel);
    clearBackdropStyle(backdrop);
    panel = null;
    backdrop = null;

    activePointerId = null;
    activeInput = null;
    phase = "idle";
    menuRequested = false;
    pendingClose = false;
    velocityX = 0;
    progress = 0;

    clearCloseRetry();

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    setDragging(false);
    setActive(false);
    setProgressImmediate(0);
  },
});
