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
    toolbar.className = "betterx-themes-toolbar";

    const newBtn = document.createElement("button");
    newBtn.className = "betterx-btn betterx-btn-primary";
    newBtn.textContent = "+ New Theme";
    newBtn.addEventListener("click", () => {
      // Replace button with inline input (prompt() unsupported in Electron sandbox)
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Theme name…";
      input.className = "betterx-theme-new-input";

      const confirmBtn = document.createElement("button");
      confirmBtn.className = "betterx-btn betterx-btn-primary";
      confirmBtn.textContent = "Create";

      const cancelBtn = document.createElement("button");
      cancelBtn.className = "betterx-btn betterx-btn-secondary";
      cancelBtn.textContent = "Cancel";

      toolbar.replaceChild(input, newBtn);
      toolbar.appendChild(confirmBtn);
      toolbar.appendChild(cancelBtn);
      input.focus();

      const restore = () => {
        toolbar.replaceChild(newBtn, input);
        confirmBtn.remove();
        cancelBtn.remove();
      };

      const confirm = async () => {
        const name = input.value.trim();
        if (!name) { restore(); return; }
        restore();
        await ctx.themeManager.create(name);
        this.render(container, ctx);
      };

      confirmBtn.addEventListener("click", () => void confirm());
      cancelBtn.addEventListener("click", restore);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") void confirm();
        if (e.key === "Escape") restore();
      });
    });

    toolbar.appendChild(newBtn);
    container.appendChild(toolbar);

    if (themes.length === 0) {
      const empty = document.createElement("div");
      empty.className = "betterx-empty-state";
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
    drag.className = "betterx-drag-handle";

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
    header.className = "betterx-editor-header";

    const title = document.createElement("h3");
    title.className = "betterx-editor-title";
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
