// ─── DOM Utilities ────────────────────────────────────────────────────────────

/**
 * Wait for an element matching `selector` to appear in the DOM.
 * Resolves immediately if already present; otherwise observes with MutationObserver.
 */
export function waitForElement(selector: string, timeout = 10_000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        if (timer !== undefined) clearTimeout(timer);
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    if (timeout > 0) {
      timer = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`waitForElement: "${selector}" not found within ${timeout}ms`));
      }, timeout);
    }
  });
}

/**
 * Create an element with optional attributes and children.
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  ...children: (string | Node)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
  }
  for (const child of children) {
    if (typeof child === "string") {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

/** Add a `<style>` element to the document head with an optional id. */
export function injectStyle(css: string, id?: string): HTMLStyleElement {
  if (id) {
    const existing = document.getElementById(id) as HTMLStyleElement | null;
    if (existing) {
      existing.textContent = css;
      return existing;
    }
  }
  const style = document.createElement("style");
  if (id) style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

/** Remove a previously injected style by id. */
export function removeStyle(id: string): void {
  document.getElementById(id)?.remove();
}
