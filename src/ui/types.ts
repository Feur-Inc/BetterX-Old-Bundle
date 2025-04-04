// Interface for the UI Manager
export interface UIManager {
  createUIElement: (tag: string, options: ElementOptions) => HTMLElement;
  captureInitialPluginStates: () => void;
  handleModalClose: (modal: HTMLElement) => void;
  populatePluginList: (container: HTMLElement) => void;
  initializeThemeUI: (modal: HTMLElement) => void;
  initializeDeveloperUI: (modal: HTMLElement) => void;
  themeChangeCallbacks?: Array<() => void>;
  themeTabVisited?: boolean;
  developerTabVisited?: boolean;
  [key: string]: any;
}

// Interface for element creation options
export interface ElementOptions {
  id?: string;
  className?: string;
  innerHTML?: string;
  [key: string]: any;
}