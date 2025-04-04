import { UIManager } from '../types';

/**
 * Interface for a tab in the settings modal
 */
export interface SettingsTab {
  /** Unique identifier for the tab */
  id: string;
  
  /** Display name shown in the tab button */
  name: string;
  
  /** Priority for tab ordering (lower numbers appear first) */
  priority: number;
  
  /** 
   * Get the HTML content for this tab
   * @returns HTML content as a string
   */
  getContent(): string;
  
  /**
   * Initialize the tab when it's first clicked
   * @param container The tab content container element
   * @param uiManager Reference to the UI manager
   */
  initialize(container: HTMLElement, uiManager: UIManager): void;
  
  /**
   * Called every time the tab is activated
   * @param container The tab content container element
   * @param uiManager Reference to the UI manager
   */
  onActivate(container: HTMLElement, uiManager: UIManager): void;
}

/**
 * Registry for tabs in the settings modal
 */
export class TabRegistry {
  private static tabs: SettingsTab[] = [];
  
  /**
   * Register a new tab
   * @param tab Tab implementation
   */
  public static registerTab(tab: SettingsTab): void {
    this.tabs.push(tab);
    // Sort tabs by priority
    this.tabs.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Get all registered tabs
   * @returns Array of registered tab implementations
   */
  public static getTabs(): SettingsTab[] {
    return [...this.tabs];
  }
  
  /**
   * Get a tab by ID
   * @param id Tab identifier
   * @returns Tab implementation or undefined if not found
   */
  public static getTab(id: string): SettingsTab | undefined {
    return this.tabs.find(tab => tab.id === id);
  }
}