import type { SettingsTab, BetterXContext } from "../tab-registry.js";
import type { Theme } from "../../types/theme.js";

// ─── Themes Tab ───────────────────────────────────────────────────────────────

export const ThemesTab: SettingsTab = {
  id: "themes",
  name: "Themes",
  priority: 20,

  initialize(container: HTMLElement, ctx: BetterXContext): void {
    this.render(container, ctx);
  },

  onActivate(container: HTMLElement, ctx: BetterXContext): void {
    this.render(container, ctx);
  },

  render(container: HTMLElement, ctx: BetterXContext): void {
    container.innerHTML = "";

    const themes = ctx.themeManager.getAll();

    // Toolbar
    const toolbar = document.createElement("div");
    toolbar.style.cssText =
      "display:flex;gap:8px;margin-bottom:16px;align-items:center;";

    const newBtn = document.createElement("button");
    newBtn.className = "betterx-btn betterx-btn-primary";
    newBtn.textContent = "+ New Theme";
    newBtn.addEventListener("click", async () => {
      const name = prompt("Theme name:");
      if (!name?.trim()) return;
      await ctx.themeManager.create(name.trim());
      this.render(container, ctx);
    });

    toolbar.appendChild(newBtn);
    container.appendChild(toolbar);

    if (themes.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText =
        "text-align:center;color:var(--betterx-textColorSecondary);padding:40px;";
      empty.textContent = "No themes yet. Create one to get started.";
      container.appendChild(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "betterx-theme-list";

    let editingId: string | null = null;

    const renderList = (): void => {
      list.innerHTML = "";
      for (const theme of ctx.themeManager.getAll()) {
        list.appendChild(this.buildThemeItem(theme, ctx, () => {
          editingId = theme.id;
          renderEditor();
        }, () => this.render(container, ctx)));
      }
    };

    const editorSection = document.createElement("div");
    editorSection.id = "betterx-theme-editor-section";

    const renderEditor = (): void => {
      if (!editingId) return;
      const theme = ctx.themeManager.get(editingId);
      if (!theme) return;
      this.renderEditor(editorSection, theme, ctx);
    };

    renderList();
    container.append(list, editorSection);
  },

  buildThemeItem(
    theme: Theme,
    ctx: BetterXContext,
    onEdit: () => void,
    onRefresh: () => void
  ): HTMLElement {
    const item = document.createElement("div");
    item.className = "betterx-theme-item";
    item.dataset["themeId"] = theme.id;

    const drag = document.createElement("span");
    drag.textContent = "⠿";
    drag.style.cssText = "color:var(--betterx-textColorSecondary);cursor:grab;font-size:16px;";

    const name = document.createElement("span");
    name.className = "betterx-theme-name";
    name.textContent = theme.name;

    // Toggle
    const toggle = document.createElement("label");
    toggle.className = "betterx-toggle";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = theme.enabled;
    const slider = document.createElement("span");
    slider.className = "betterx-toggle-slider";
    toggle.append(input, slider);
    input.addEventListener("change", () => {
      ctx.themeManager.toggle(theme.id).catch(console.error);
    });

    const editBtn = document.createElement("button");
    editBtn.className = "betterx-btn betterx-btn-secondary";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", onEdit);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "betterx-btn betterx-btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete "${theme.name}"?`)) return;
      await ctx.themeManager.delete(theme.id);
      onRefresh();
    });

    item.append(drag, name, toggle, editBtn, deleteBtn);
    return item;
  },

  renderEditor(container: HTMLElement, theme: Theme, ctx: BetterXContext): void {
    container.innerHTML = "";

    const header = document.createElement("div");
    header.style.cssText =
      "display:flex;align-items:center;gap:8px;margin-bottom:8px;";

    const title = document.createElement("h3");
    title.style.cssText = "flex:1;font-size:14px;color:var(--betterx-textColor);margin:0;";
    title.textContent = `Editing: ${theme.name}`;

    const saveBtn = document.createElement("button");
    saveBtn.className = "betterx-btn betterx-btn-primary";
    saveBtn.textContent = "Save";

    header.append(title, saveBtn);

    // CodeMirror editor
    const editorEl = document.createElement("div");
    editorEl.className = "betterx-theme-editor";

    container.append(header, editorEl);

    // Lazy load CodeMirror
    let currentCSS = theme.css;

    import("codemirror").then(({ EditorView, basicSetup }) => {
      import("@codemirror/lang-css").then(({ css }) => {
        import("@codemirror/theme-one-dark").then(({ oneDark }) => {
          const view = new EditorView({
            doc: theme.css,
            extensions: [
              basicSetup,
              css(),
              oneDark,
              EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                  currentCSS = update.state.doc.toString();
                }
              }),
            ],
            parent: editorEl,
          });

          saveBtn.addEventListener("click", async () => {
            await ctx.themeManager.update(theme.id, currentCSS);
            ctx.notifications.showSuccess(`Theme "${theme.name}" saved.`);
          });

          // Cleanup when editor is removed
          const mo = new MutationObserver(() => {
            if (!document.body.contains(editorEl)) {
              view.destroy();
              mo.disconnect();
            }
          });
          mo.observe(document.body, { childList: true, subtree: true });
        });
      });
    });
  },
} as SettingsTab & {
  render(container: HTMLElement, ctx: BetterXContext): void;
  buildThemeItem(theme: Theme, ctx: BetterXContext, onEdit: () => void, onRefresh: () => void): HTMLElement;
  renderEditor(container: HTMLElement, theme: Theme, ctx: BetterXContext): void;
};
