import { SettingsTab } from './tab-interface';
import { UIManager } from '../types';

/**
 * Implementation of the Plugins tab in settings
 */
export class PluginsTab implements SettingsTab {
  id = 'plugins';
  name = 'Plugins';
  priority = 10; // Lower priority means it shows first

  getContent(): string {
    return `
      <div id="betterx-plugins-tab" class="betterx-tab-content">
        <input type="text" class="betterx-input search-bar" placeholder="Search plugins..." id="plugin-search">
        <div id="betterx-plugin-list"></div>
      </div>
    `;
  }

  initialize(container: HTMLElement, uiManager: UIManager): void {
    this.setupSearchListener(container, uiManager);
    // Populate the plugins list
    this.onActivate(container, uiManager);
  }

  onActivate(container: HTMLElement, uiManager: UIManager): void {
    uiManager.captureInitialPluginStates();
    uiManager.populatePluginList(container.querySelector('#betterx-plugin-list') as HTMLElement);
  }

  private setupSearchListener(container: HTMLElement, uiManager: UIManager): void {
    const searchInput = container.querySelector('#plugin-search') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        uiManager.populatePluginList(container.querySelector('#betterx-plugin-list') as HTMLElement);
      });
    }
  }
}