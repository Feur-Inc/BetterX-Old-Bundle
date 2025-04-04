import { SettingsTab } from './tab-interface';
import { UIManager } from '../types';

/**
 * Implementation of the Themes tab in settings
 */
export class ThemesTab implements SettingsTab {
  id = 'themes';
  name = 'Themes';
  priority = 20;

  getContent(): string {
    return `
      <div id="betterx-themes-tab" class="betterx-tab-content">
        <div class="betterx-theme-controls">
          <button class="betterx-button" id="new-theme">Create New Theme</button>
        </div>
        <div class="betterx-themes-container"></div>
      </div>
    `;
  }

  initialize(container: HTMLElement, uiManager: UIManager): void {
    uiManager.initializeThemeUI(container);
    uiManager.themeTabVisited = true;
  }

  onActivate(container: HTMLElement, uiManager: UIManager): void {
    // No need to do anything special on reactivation since themes are already loaded
  }
}