import { TabRegistry } from './tab-interface';
import { PluginsTab } from './plugins-tab';
import { ThemesTab } from './themes-tab';
import { DeveloperTab } from './developer-tab';
import { CloudTab } from './cloud-tab';

/**
 * Initialize the tab registry with the default tabs
 */
export function registerDefaultTabs(): void {
    // Register the default tabs
    TabRegistry.registerTab(new PluginsTab());
    TabRegistry.registerTab(new ThemesTab());
    TabRegistry.registerTab(new DeveloperTab());
    TabRegistry.registerTab(new CloudTab());
}

/**
 * Get the registered tab names and IDs for generating tab buttons
 * @returns Array of tab data objects with id and name properties
 */
export function getTabButtonsData(): Array<{ id: string, name: string }> {
    return TabRegistry.getTabs().map(tab => ({
        id: tab.id,
        name: tab.name
    }));
}