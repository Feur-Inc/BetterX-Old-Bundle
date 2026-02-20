// ─── BetterX UI Styles ────────────────────────────────────────────────────────

export const BETTERX_STYLES = `
/* === CSS Variables === */
:root {
  --betterx-bg: rgba(0, 0, 0, 0.7);
  --betterx-modalBg: #1e1e2e;
  --betterx-contentBg: #2a2a3e;
  --betterx-borderColor: #3a3a52;
  --betterx-textColor: #e0e0f0;
  --betterx-textColorSecondary: #9090b0;
  --betterx-accentColor: #1d9bf0;
  --betterx-hoverBg: #35354a;
  --betterx-switchBg: #3a3a52;
  --betterx-notificationBg: #2a2a3e;
  --betterx-searchBarBg: #1a1a2e;
  --betterx-danger: #ef4444;
  --betterx-success: #22c55e;
  --betterx-warning: #f59e0b;
}

/* === Modal Overlay === */
#betterx-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--betterx-bg);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: betterxFadeIn 0.15s ease;
}

/* === Modal === */
#betterx-modal {
  background: var(--betterx-modalBg);
  border: 1px solid var(--betterx-borderColor);
  border-radius: 16px;
  width: 820px;
  max-width: calc(100vw - 32px);
  height: 600px;
  max-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: betterxSlideUp 0.2s ease;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

/* === Modal Header === */
.betterx-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  border-bottom: 1px solid var(--betterx-borderColor);
  flex-shrink: 0;
}

.betterx-modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--betterx-textColor);
  display: flex;
  align-items: center;
  gap: 10px;
}

.betterx-modal-title-logo {
  width: 28px;
  height: 28px;
  color: var(--betterx-accentColor);
}

.betterx-modal-close {
  background: none;
  border: none;
  color: var(--betterx-textColorSecondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  font-size: 18px;
  line-height: 1;
  transition: color 0.15s, background 0.15s;
}
.betterx-modal-close:hover {
  color: var(--betterx-textColor);
  background: var(--betterx-hoverBg);
}

/* === Tabs === */
.betterx-tabs {
  display: flex;
  gap: 2px;
  padding: 0 24px;
  margin-top: 4px;
}

.betterx-tab {
  padding: 10px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--betterx-textColorSecondary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.betterx-tab:hover {
  color: var(--betterx-textColor);
}

.betterx-tab.betterx-tab-active {
  color: var(--betterx-accentColor);
  border-bottom-color: var(--betterx-accentColor);
}

/* === Modal Body === */
.betterx-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  scrollbar-width: thin;
  scrollbar-color: var(--betterx-borderColor) transparent;
}
.betterx-modal-body::-webkit-scrollbar { width: 6px; }
.betterx-modal-body::-webkit-scrollbar-track { background: transparent; }
.betterx-modal-body::-webkit-scrollbar-thumb { background: var(--betterx-borderColor); border-radius: 3px; }

/* === Plugin List === */
.betterx-search-bar {
  width: 100%;
  padding: 10px 14px;
  background: var(--betterx-searchBarBg);
  border: 1px solid var(--betterx-borderColor);
  border-radius: 10px;
  color: var(--betterx-textColor);
  font-size: 14px;
  outline: none;
  margin-bottom: 16px;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.betterx-search-bar:focus { border-color: var(--betterx-accentColor); }
.betterx-search-bar::placeholder { color: var(--betterx-textColorSecondary); }

.betterx-plugin-item {
  background: var(--betterx-contentBg);
  border: 1px solid var(--betterx-borderColor);
  border-radius: 10px;
  margin-bottom: 8px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.betterx-plugin-item:hover { border-color: var(--betterx-accentColor); }

.betterx-plugin-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  gap: 12px;
}

.betterx-plugin-info { flex: 1; min-width: 0; }

.betterx-plugin-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--betterx-textColor);
  display: flex;
  align-items: center;
  gap: 8px;
}

.betterx-plugin-description {
  font-size: 13px;
  color: var(--betterx-textColorSecondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.betterx-plugin-body {
  padding: 0 16px 14px;
  border-top: 1px solid var(--betterx-borderColor);
}

.betterx-plugin-authors {
  display: flex;
  gap: 8px;
  margin: 10px 0;
  flex-wrap: wrap;
}

.betterx-author-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--betterx-searchBarBg);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 12px;
  color: var(--betterx-textColorSecondary);
  text-decoration: none;
}

.betterx-author-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

/* === Toggle Switch === */
.betterx-toggle {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.betterx-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.betterx-toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--betterx-switchBg);
  border-radius: 24px;
  cursor: pointer;
  transition: background 0.2s;
}

.betterx-toggle-slider::before {
  content: "";
  position: absolute;
  left: 3px;
  top: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
}

.betterx-toggle input:checked + .betterx-toggle-slider {
  background: var(--betterx-accentColor);
}

.betterx-toggle input:checked + .betterx-toggle-slider::before {
  transform: translateX(20px);
}

/* === Option Controls === */
.betterx-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  gap: 12px;
  border-bottom: 1px solid var(--betterx-borderColor);
}
.betterx-option:last-child { border-bottom: none; }

.betterx-option-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--betterx-textColor);
}

.betterx-option-description {
  font-size: 12px;
  color: var(--betterx-textColorSecondary);
  margin-top: 2px;
}

.betterx-option-control {
  flex-shrink: 0;
}

.betterx-select {
  background: var(--betterx-searchBarBg);
  border: 1px solid var(--betterx-borderColor);
  border-radius: 8px;
  color: var(--betterx-textColor);
  padding: 6px 10px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}
.betterx-select:focus { border-color: var(--betterx-accentColor); }

.betterx-input-text {
  background: var(--betterx-searchBarBg);
  border: 1px solid var(--betterx-borderColor);
  border-radius: 8px;
  color: var(--betterx-textColor);
  padding: 6px 10px;
  font-size: 13px;
  outline: none;
  width: 180px;
}
.betterx-input-text:focus { border-color: var(--betterx-accentColor); }

.betterx-input-number {
  background: var(--betterx-searchBarBg);
  border: 1px solid var(--betterx-borderColor);
  border-radius: 8px;
  color: var(--betterx-textColor);
  padding: 6px 10px;
  font-size: 13px;
  outline: none;
  width: 100px;
}
.betterx-input-number:focus { border-color: var(--betterx-accentColor); }

/* === Theme Editor === */
.betterx-theme-list { display: flex; flex-direction: column; gap: 8px; }

.betterx-theme-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--betterx-contentBg);
  border: 1px solid var(--betterx-borderColor);
  border-radius: 10px;
  gap: 12px;
  cursor: grab;
  transition: border-color 0.15s, background 0.15s;
}
.betterx-theme-item:hover { border-color: var(--betterx-accentColor); }
.betterx-theme-item.betterx-dragging { opacity: 0.5; cursor: grabbing; }

.betterx-theme-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--betterx-textColor);
}

.betterx-btn {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, background 0.15s;
}
.betterx-btn:hover { opacity: 0.85; }

.betterx-btn-primary {
  background: var(--betterx-accentColor);
  color: white;
}

.betterx-btn-secondary {
  background: var(--betterx-contentBg);
  border: 1px solid var(--betterx-borderColor);
  color: var(--betterx-textColor);
}

.betterx-btn-danger {
  background: var(--betterx-danger);
  color: white;
}

.betterx-theme-editor {
  border: 1px solid var(--betterx-borderColor);
  border-radius: 10px;
  overflow: hidden;
  margin-top: 12px;
}

/* === Developer Tab === */
.betterx-dev-section {
  background: var(--betterx-contentBg);
  border: 1px solid var(--betterx-borderColor);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.betterx-dev-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--betterx-textColor);
  margin: 0 0 12px;
}

.betterx-dev-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* === About Tab === */
.betterx-about {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  gap: 16px;
}

.betterx-about-logo {
  width: 80px;
  height: 80px;
  color: var(--betterx-accentColor);
}

.betterx-about h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--betterx-textColor);
  margin: 0;
}

.betterx-about-version {
  font-size: 13px;
  color: var(--betterx-textColorSecondary);
}

.betterx-about-contributors {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

/* === Notifications === */
.betterx-notification-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  max-width: 360px;
  width: 100%;
}

.betterx-notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--betterx-notificationBg);
  border: 1px solid var(--betterx-borderColor);
  border-radius: 12px;
  pointer-events: all;
  position: relative;
  opacity: 0;
  transform: translateX(100%);
  transition: opacity 0.25s, transform 0.25s;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.betterx-notification-show {
  opacity: 1;
  transform: translateX(0);
}

.betterx-notification-hide {
  opacity: 0;
  transform: translateX(100%);
}

.betterx-notification-info    { border-left: 3px solid #1d9bf0; }
.betterx-notification-success { border-left: 3px solid #22c55e; }
.betterx-notification-warning { border-left: 3px solid #f59e0b; }
.betterx-notification-error   { border-left: 3px solid #ef4444; }

.betterx-notification-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}
.betterx-notification-info    .betterx-notification-icon { color: #1d9bf0; }
.betterx-notification-success .betterx-notification-icon { color: #22c55e; }
.betterx-notification-warning .betterx-notification-icon { color: #f59e0b; }
.betterx-notification-error   .betterx-notification-icon { color: #ef4444; }

.betterx-notification-icon svg { width: 100%; height: 100%; display: block; }

.betterx-notification-content { flex: 1; min-width: 0; }

.betterx-notification-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--betterx-textColor);
  margin: 0 0 4px;
}

.betterx-notification-message {
  font-size: 13px;
  color: var(--betterx-textColorSecondary);
  margin: 0;
  word-break: break-word;
}

.betterx-notification-close {
  background: none;
  border: none;
  color: var(--betterx-textColorSecondary);
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.15s;
}
.betterx-notification-close:hover { color: var(--betterx-textColor); }

.betterx-notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.betterx-notification-action {
  padding: 5px 10px;
  background: var(--betterx-hoverBg);
  border: 1px solid var(--betterx-borderColor);
  border-radius: 6px;
  color: var(--betterx-textColor);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.betterx-notification-action:hover { background: var(--betterx-accentColor); }

.betterx-notification-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--betterx-borderColor);
}

.betterx-notification-progress {
  height: 100%;
  background: var(--betterx-accentColor);
  width: 100%;
}

/* === BetterX Nav Button === */
.betterx-nav-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 9999px;
  cursor: pointer;
  transition: background 0.15s;
  color: var(--betterx-textColor, inherit);
  text-decoration: none;
  width: 100%;
}

.betterx-nav-button:hover {
  background: var(--betterx-hoverBg);
}

.betterx-nav-icon {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  color: var(--betterx-accentColor);
}

.betterx-nav-label {
  font-size: 20px;
  font-weight: 400;
}

/* === Animations === */
@keyframes betterxFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes betterxSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* === Footer === */
#betterx-footer-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--betterx-textColorSecondary);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: color 0.15s;
}
#betterx-footer-badge:hover { color: var(--betterx-accentColor); }
#betterx-footer-badge svg { width: 16px; height: 16px; color: var(--betterx-accentColor); }
`;
