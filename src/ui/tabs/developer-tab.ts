import { SettingsTab } from './tab-interface';
import { UIManager } from '../types';

/**
 * Implementation of the Developer tab in settings
 */
export class DeveloperTab implements SettingsTab {
  id = 'developer';
  name = 'Developer';
  priority = 40;

  getContent(): string {
    return `
      <div id="betterx-developer-tab" class="betterx-tab-content">
      </div>
    `;
  }

  initialize(container: HTMLElement, uiManager: UIManager): void {
    if (container) {
      uiManager.initializeDeveloperUI(container);
      uiManager.developerTabVisited = true;
    }
  }

  onActivate(container: HTMLElement, uiManager: UIManager): void {
  }
}