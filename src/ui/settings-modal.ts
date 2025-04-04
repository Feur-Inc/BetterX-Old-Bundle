import { Name } from "../utils/constants";
import { UIManager } from "./types";
import { TabRegistry } from "./tabs/tab-interface";
import { registerDefaultTabs, getTabButtonsData } from "./tabs";

export function createSettingsModal(uiManager: UIManager): HTMLElement {
  // Initialize all tabs
  registerDefaultTabs();
  
  // Get tab button data from the registry
  const tabButtonsData = getTabButtonsData();
  
  // Create tab buttons HTML
  const tabButtons = tabButtonsData.map((tab, index) => 
    `<button class="betterx-tab ${index === 0 ? 'active' : ''}" data-tab="${tab.id}">${tab.name}</button>`
  ).join('');
  
  // Create tab content containers HTML
  const tabContentHTML = TabRegistry.getTabs().map(tab => tab.getContent()).join('');
  
  // Create the modal with dynamic tabs
  const modal = uiManager.createUIElement('div', {
    id: 'betterx-settings-modal',
    className: 'betterx-modal',
    innerHTML: `
      <div class="betterx-modal-content">
        <div class="betterx-modal-header">
          <h2>${Name} Settings</h2>
          <span class="betterx-close">&times;</span>
        </div>
        <div class="betterx-tabs">
          ${tabButtons}
        </div>
        <div class="betterx-modal-body">
          ${tabContentHTML}
        </div>
      </div>
    `
  });

  // Add event listeners for the modal
  const closeBtn = modal.querySelector('.betterx-close') as HTMLElement;
  closeBtn.onclick = () => uiManager.handleModalClose(modal);
  
  window.onclick = (event: MouseEvent) => {
    if (event.target == modal) {
      uiManager.handleModalClose(modal);
    }
  };
  
  // Set up tab behavior
  setupTabs(modal, uiManager);
  
  // Activate the first tab (usually Plugins)
  activateTab(modal, TabRegistry.getTabs()[0].id, uiManager);
  
  return modal;
}

/**
 * Set up tab click handlers
 */
function setupTabs(modal: HTMLElement, uiManager: UIManager): void {
  const tabs = modal.querySelectorAll('.betterx-tab') as NodeListOf<HTMLElement>;
  
  // Add to theme change callbacks to update when accent changes
  if (uiManager.themeChangeCallbacks) {
    uiManager.themeChangeCallbacks.push(() => {
      setTimeout(() => updateTabColors(modal), 0);
    });
  }
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab') as string;
      activateTab(modal, tabId, uiManager);
    });
  });
  
  // Initial tab color setup
  setTimeout(() => updateTabColors(modal), 0);
}

/**
 * Activate a specific tab
 */
function activateTab(modal: HTMLElement, tabId: string, uiManager: UIManager): void {
  const tabs = modal.querySelectorAll('.betterx-tab') as NodeListOf<HTMLElement>;
  const tabContents = modal.querySelectorAll('.betterx-tab-content') as NodeListOf<HTMLElement>;
  const tabInstance = TabRegistry.getTab(tabId);
  
  if (!tabInstance) return;
  
  // Deactivate all tabs
  tabs.forEach(t => {
    t.classList.remove('active');
    t.style.color = '';
    t.style.borderBottomColor = 'transparent';
  });
  
  tabContents.forEach(c => c.classList.remove('active'));
  
  // Activate selected tab
  const selectedTab = modal.querySelector(`[data-tab="${tabId}"]`) as HTMLElement;
  if (selectedTab) {
    selectedTab.classList.add('active');
  }
  
  // Get tab content element
  const tabContentId = `betterx-${tabId}-tab`;
  const tabContent = modal.querySelector(`#${tabContentId}`) as HTMLElement;
  
  if (tabContent) {
    tabContent.classList.add('active');
    
    // Check if this tab has been initialized
    const visitedFlag = `${tabId}TabVisited`;
    if (!uiManager[visitedFlag]) {
      tabInstance.initialize(tabContent, uiManager);
    } else {
      tabInstance.onActivate(tabContent, uiManager);
    }
  }
  
  // Update tab colors
  updateTabColors(modal);
}

/**
 * Update tab colors based on theme accent color
 */
function updateTabColors(modal: HTMLElement): void {
  const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--betterx-accentColor').trim();
  const tabs = modal.querySelectorAll('.betterx-tab') as NodeListOf<HTMLElement>;
  
  tabs.forEach(tab => {
    if (tab.classList.contains('active')) {
      tab.style.color = activeColor;
      tab.style.borderBottomColor = activeColor;
    } else {
      tab.style.color = '';
      tab.style.borderBottomColor = 'transparent';
    }
  });
}
