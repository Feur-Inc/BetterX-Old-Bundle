import type { SettingsTab, BetterXContext } from "../tab-registry.js";
import type { Plugin, PluginOptionDef, PluginOptionDefs } from "../../types/plugin.js";
import { OptionType } from "../../types/plugin.js";

// ─── Plugins Tab ──────────────────────────────────────────────────────────────

function escHtml(str: string): string {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function renderOptions(container: HTMLElement, plugin: Plugin, ctx: BetterXContext): void {
  if (!plugin.options || Object.keys(plugin.options).length === 0) return;

  const optContainer = document.createElement("div");
  optContainer.className = "betterx-plugin-options";

  for (const [key, opt] of Object.entries(plugin.options) as [string, PluginOptionDef][]) {
    if (opt.hidden) continue;

    const row = document.createElement("div");
    row.className = "betterx-option";

    const labelGroup = document.createElement("div");
    labelGroup.className = "betterx-option-label-group";
    const label = document.createElement("div");
    label.className = "betterx-option-label";
    label.textContent = opt.label ?? key;
    labelGroup.appendChild(label);

    if (opt.description) {
      const desc = document.createElement("div");
      desc.className = "betterx-option-description";
      desc.textContent = opt.description;
      labelGroup.appendChild(desc);
    }

    const control = document.createElement("div");
    control.className = "betterx-option-control";

    const currentValue = (plugin.settings.store as Record<string, unknown>)[key];

    if (opt.type === OptionType.BOOLEAN) {
      const label_ = document.createElement("label");
      label_.className = "betterx-toggle";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = currentValue as boolean;
      const slider = document.createElement("span");
      slider.className = "betterx-toggle-slider";
      label_.append(input, slider);
      input.addEventListener("change", () => {
        ctx.pluginManager.updateOption(plugin.name, key, input.checked).catch(console.error);
      });
      control.appendChild(label_);
    } else if (opt.type === OptionType.SELECT && opt.options) {
      const select = document.createElement("select");
      select.className = "betterx-select";
      for (const o of opt.options) {
        const option = document.createElement("option");
        option.value = o.value;
        option.textContent = o.label;
        if (o.value === currentValue) option.selected = true;
        select.appendChild(option);
      }
      select.addEventListener("change", () => {
        ctx.pluginManager.updateOption(plugin.name, key, select.value).catch(console.error);
      });
      control.appendChild(select);
    } else if (opt.type === OptionType.STRING) {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "betterx-input-text";
      input.value = currentValue as string;
      input.addEventListener("change", () => {
        ctx.pluginManager.updateOption(plugin.name, key, input.value).catch(console.error);
      });
      control.appendChild(input);
    } else if (opt.type === OptionType.NUMBER) {
      const input = document.createElement("input");
      input.type = "number";
      input.className = "betterx-input-number";
      input.value = String(currentValue as number);
      input.addEventListener("change", () => {
        ctx.pluginManager.updateOption(plugin.name, key, Number(input.value)).catch(console.error);
      });
      control.appendChild(input);
    } else if (opt.type === OptionType.COLOR) {
      const wrapper = document.createElement("div");
      wrapper.className = "betterx-color-picker";
      const colorInput = document.createElement("input");
      colorInput.type = "color";
      colorInput.className = "betterx-input-color";
      colorInput.value = (currentValue as string) || "#1d9bf0";
      const hexInput = document.createElement("input");
      hexInput.type = "text";
      hexInput.className = "betterx-input-text betterx-input-color-hex";
      hexInput.value = (currentValue as string) || "#1d9bf0";
      hexInput.maxLength = 7;
      colorInput.addEventListener("input", () => {
        hexInput.value = colorInput.value;
        ctx.pluginManager.updateOption(plugin.name, key, colorInput.value).catch(console.error);
      });
      hexInput.addEventListener("change", () => {
        const v = hexInput.value.trim();
        if (/^#[0-9a-f]{6}$/i.test(v)) {
          colorInput.value = v;
          ctx.pluginManager.updateOption(plugin.name, key, v).catch(console.error);
        }
      });
      wrapper.append(colorInput, hexInput);
      control.appendChild(wrapper);
    }

    row.append(labelGroup, control);
    optContainer.appendChild(row);
  }

  container.appendChild(optContainer);
}

function platformLabel(platform: string): string {
  if (platform === "desktop") return "Desktop only";
  if (platform === "extension") return "Extension only";
  return platform;
}

function renderPlugin(plugin: Plugin, ctx: BetterXContext): HTMLElement {
  const item = document.createElement("div");
  item.className = plugin.unavailable
    ? "betterx-plugin-item betterx-plugin-item-unavailable"
    : "betterx-plugin-item";

  const header = document.createElement("div");
  header.className = "betterx-plugin-header";

  const info = document.createElement("div");
  info.className = "betterx-plugin-info";

  const nameRow = document.createElement("div");
  nameRow.className = "betterx-plugin-name";
  nameRow.textContent = plugin.name;

  if (plugin.unavailable && plugin.platform) {
    const badge = document.createElement("span");
    badge.className = "betterx-platform-badge";
    badge.textContent = platformLabel(plugin.platform);
    nameRow.appendChild(badge);
  }

  const desc = document.createElement("div");
  desc.className = "betterx-plugin-description";
  desc.textContent = plugin.description ?? "";

  info.append(nameRow, desc);

  // Toggle
  const toggle = document.createElement("label");
  toggle.className = "betterx-toggle";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = plugin.enabled;
  input.disabled = !!plugin.unavailable;
  const slider = document.createElement("span");
  slider.className = "betterx-toggle-slider";
  toggle.append(input, slider);
  input.addEventListener("change", () => {
    ctx.pluginManager.toggle(plugin.name).catch(console.error);
  });

  header.append(info, toggle);
  item.appendChild(header);

  // Expand body on click
  const hasDetails =
    (plugin.authors && plugin.authors.length > 0) ||
    (plugin.options && Object.keys(plugin.options).length > 0) ||
    plugin.renderSettings;

  if (hasDetails) {
    const body = document.createElement("div");
    body.className = "betterx-plugin-body";
    body.style.display = "none";

    if (plugin.authors && plugin.authors.length > 0) {
      const authors = document.createElement("div");
      authors.className = "betterx-plugin-authors";
      for (const author of plugin.authors) {
        const badge = document.createElement("a");
        badge.className = "betterx-author-badge";
        badge.href = `https://x.com/${author.handle}`;
        badge.target = "_blank";
        badge.rel = "noopener noreferrer";
        badge.innerHTML = `
          <img class="betterx-author-avatar"
               src="https://unavatar.io/twitter/${escHtml(author.handle)}"
               alt="${escHtml(author.name)}">
          @${escHtml(author.handle)}
        `;
        const avatar = badge.querySelector<HTMLImageElement>("img");
        if (avatar) avatar.addEventListener("error", () => { avatar.style.display = "none"; });
        authors.appendChild(badge);
      }
      body.appendChild(authors);
    }

    if (plugin.renderSettings) {
      plugin.renderSettings(body);
    } else {
      renderOptions(body, plugin, ctx);
    }

    item.appendChild(body);

    header.style.cursor = "pointer";
    header.addEventListener("click", (e) => {
      // Don't collapse when toggling
      if ((e.target as HTMLElement).closest(".betterx-toggle")) return;
      body.style.display = body.style.display === "none" ? "" : "none";
    });
  }

  return item;
}

export const PluginsTab: SettingsTab = {
  id: "plugins",
  name: "Plugins",
  priority: 10,

  initialize(container: HTMLElement, ctx: BetterXContext): void {
    container.innerHTML = "";

    // Toolbar: search + view toggle
    const toolbar = document.createElement("div");
    toolbar.className = "betterx-plugins-toolbar";

    const search = document.createElement("input");
    search.type = "search";
    search.className = "betterx-search-bar";
    search.placeholder = "Search plugins…";

    const viewToggle = document.createElement("div");
    viewToggle.className = "betterx-view-toggle";

    const listBtn = document.createElement("button");
    listBtn.className = "betterx-view-btn betterx-view-btn-active";
    listBtn.title = "List view";
    listBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><rect x="0" y="1" width="16" height="2.5" rx="1"/><rect x="0" y="6.75" width="16" height="2.5" rx="1"/><rect x="0" y="12.5" width="16" height="2.5" rx="1"/></svg>`;

    const gridBtn = document.createElement("button");
    gridBtn.className = "betterx-view-btn";
    gridBtn.title = "Grid view";
    gridBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16"><rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="7" rx="1"/><rect x="0" y="9" width="7" height="7" rx="1"/><rect x="9" y="9" width="7" height="7" rx="1"/></svg>`;

    viewToggle.append(listBtn, gridBtn);
    toolbar.append(search, viewToggle);

    const list = document.createElement("div");
    list.className = "betterx-plugin-list";

    const plugins = ctx.pluginManager.getAll();
    const items = plugins.map((p) => ({ plugin: p, el: renderPlugin(p, ctx) }));
    for (const { el } of items) list.appendChild(el);

    listBtn.addEventListener("click", () => {
      list.classList.remove("betterx-grid-view");
      listBtn.classList.add("betterx-view-btn-active");
      gridBtn.classList.remove("betterx-view-btn-active");
    });

    gridBtn.addEventListener("click", () => {
      list.classList.add("betterx-grid-view");
      gridBtn.classList.add("betterx-view-btn-active");
      listBtn.classList.remove("betterx-view-btn-active");
    });

    search.addEventListener("input", () => {
      const q = search.value.toLowerCase();
      for (const { plugin, el } of items) {
        const match =
          plugin.name.toLowerCase().includes(q) ||
          (plugin.description?.toLowerCase().includes(q) ?? false);
        el.style.display = match ? "" : "none";
      }
    });

    container.append(toolbar, list);
  },

  onActivate(container: HTMLElement, ctx: BetterXContext): void {
    // Refresh toggle states (plugin could have been toggled programmatically)
    const plugins = ctx.pluginManager.getAll();
    const items = container.querySelectorAll<HTMLElement>(".betterx-plugin-item");
    items.forEach((item, i) => {
      const p = plugins[i];
      if (!p) return;
      const input = item.querySelector<HTMLInputElement>(".betterx-toggle input");
      if (input) input.checked = p.enabled;
    });
  },
};
