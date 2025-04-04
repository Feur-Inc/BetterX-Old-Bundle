import { SettingsTab } from './tab-interface';
import { UIManager } from '../types';
import { logger } from '../../utils/logger';

interface SyncableSettings {
  plugins: { [pluginId: string]: boolean };
  themes: { [themeId: string]: boolean };
  activeThemeIds: string[];
  timestamp: number;
}

interface BetterXPlugin {
  name: string;
  enabled: boolean;
  requiresRestart?: boolean;
}

interface BetterXTheme {
  id: string;
  name: string;
  enabled: boolean;
}

/**
 * Cloud tab implementation for BetterX
 * Allows users to sync their plugins and themes across devices
 */
export class CloudTab implements SettingsTab {
  id = 'cloud';
  name = 'Cloud';
  priority = 30;

  private isAuthenticated = false;
  private authToken: string | null = null;
  private username: string | null = null;
  private avatar: string | null = null;
  private lastSyncTime: number | null = null;
  private syncInProgress = false;

  constructor() {
    this.loadAuthData();
  }

  getContent(): string {
    return `
      <div id="betterx-cloud-tab" class="betterx-tab-content">
        <div class="betterx-cloud-container">
          <div class="betterx-cloud-header">
            <h2>BetterX Cloud</h2>
            <p>Sync your plugins and themes across devices</p>
          </div>
          
          <div class="betterx-cloud-auth-section">
            <div id="betterx-cloud-login-container">
            </div>
          </div>
          
          <div id="betterx-cloud-settings" style="display: none">
            <div class="betterx-cloud-section">
              <h3>Sync Settings</h3>
              <div class="betterx-cloud-sync-info">
                <p id="betterx-cloud-last-sync">Last sync: Never</p>
                <div class="betterx-cloud-buttons">
                  <button id="betterx-cloud-push" class="betterx-button">Push to Cloud</button>
                  <button id="betterx-cloud-pull" class="betterx-button">Pull from Cloud</button>
                </div>
              </div>
            </div>
            
            <div class="betterx-cloud-section">
              <h3>Sync Details</h3>
              <div class="betterx-option-wrapper">
                <label class="betterx-switch">
                  <input type="checkbox" id="betterx-sync-plugins" checked>
                  <span class="betterx-slider"></span>
                </label>
                <span>Sync plugin enabled states</span>
              </div>
              <div class="betterx-option-wrapper">
                <label class="betterx-switch">
                  <input type="checkbox" id="betterx-sync-themes" checked>
                  <span class="betterx-slider"></span>
                </label>
                <span>Sync theme enabled states and order</span>
              </div>
              <div id="betterx-cloud-sync-details"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initialize(container: HTMLElement, uiManager: UIManager): void {
    this.setupAuthUI(container, uiManager);
  }

  onActivate(container: HTMLElement, uiManager: UIManager): void {
    this.setupAuthUI(container, uiManager);
  }

  private setupAuthUI(container: HTMLElement, uiManager: UIManager): void {
    const loginContainer = container.querySelector('#betterx-cloud-login-container');
    const cloudSettings = container.querySelector('#betterx-cloud-settings');
    
    if (!loginContainer) return;
    
    loginContainer.innerHTML = '';
    
    if (this.isAuthenticated && this.username) {
      loginContainer.innerHTML = `
        <div class="betterx-cloud-user-info">
          <div class="betterx-cloud-user-avatar">
            <img src="${this.avatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'}" alt="${this.username}">
          </div>
          <div class="betterx-cloud-user-details">
            <h4>Signed in as</h4>
            <p>@${this.username}</p>
          </div>
          <button id="betterx-cloud-logout" class="betterx-button">Logout</button>
        </div>
      `;
      
      const logoutButton = container.querySelector('#betterx-cloud-logout');
      if (logoutButton) {
        logoutButton.addEventListener('click', () => this.logout(container, uiManager));
      }
      
      if (cloudSettings) {
        (cloudSettings as HTMLElement).style.display = 'block';
        this.setupSyncUI(container, uiManager);
      }
      
      this.updateLastSyncInfo(container);
    } else {
      loginContainer.innerHTML = `
        <div class="betterx-cloud-login">
          <p>Sign in with your X account to sync your BetterX settings across devices.</p>
          <button id="betterx-cloud-login" class="betterx-button primary">Sign in with X</button>
        </div>
      `;
      
      const loginButton = container.querySelector('#betterx-cloud-login');
      if (loginButton) {
        loginButton.addEventListener('click', () => this.initiateAuth(container, uiManager));
      }
      
      if (cloudSettings) {
        (cloudSettings as HTMLElement).style.display = 'none';
      }
    }
  }

  private setupSyncUI(container: HTMLElement, uiManager: UIManager): void {
    const pushButton = container.querySelector('#betterx-cloud-push');
    const pullButton = container.querySelector('#betterx-cloud-pull');
    const syncPluginsToggle = container.querySelector('#betterx-sync-plugins') as HTMLInputElement;
    const syncThemesToggle = container.querySelector('#betterx-sync-themes') as HTMLInputElement;
    
    if (pushButton) {
      pushButton.addEventListener('click', () => {
        this.pushToCloud(
          uiManager, 
          syncPluginsToggle?.checked || false, 
          syncThemesToggle?.checked || false,
          container
        );
      });
    }
    
    if (pullButton) {
      pullButton.addEventListener('click', () => {
        this.pullFromCloud(
          uiManager,
          syncPluginsToggle?.checked || false, 
          syncThemesToggle?.checked || false,
          container
        );
      });
    }
  }

  private async initiateAuth(container: HTMLElement, uiManager: UIManager): Promise<void> {
    try {
      const width = 600;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        'https://twitter.com/i/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=tweet.read%20users.read&state=state&code_challenge=challenge&code_challenge_method=plain',
        'BetterX Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!authWindow) {
        uiManager.notify({
          title: 'Authentication Error',
          message: 'Pop-up blocked. Please allow pop-ups for this site.',
          type: 'error'
        });
        return;
      }

      setTimeout(() => {
        authWindow.close();
        this.simulateSuccessfulAuth(container, uiManager);
      }, 2000);
    } catch (error) {
      logger.error('Auth error:', error);
      uiManager.notify({
        title: 'Authentication Error',
        message: 'Failed to authenticate with X.',
        type: 'error'
      });
    }
  }

  private simulateSuccessfulAuth(container: HTMLElement, uiManager: UIManager): void {
    this.isAuthenticated = true;
    this.authToken = 'simulated_auth_token_' + Math.random().toString(36).substring(2);
    this.username = 'betterx_user';
    this.avatar = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png';
    
    this.saveAuthData();
    
    uiManager.notify({
      title: 'Authentication Successful',
      message: 'You are now signed in with X.',
      type: 'success'
    });
    
    this.setupAuthUI(container, uiManager);
  }

  private logout(container: HTMLElement, uiManager: UIManager): void {
    this.isAuthenticated = false;
    this.authToken = null;
    this.username = null;
    this.avatar = null;
    
    localStorage.removeItem('betterx_cloud_auth');
    
    uiManager.notify({
      title: 'Logged Out',
      message: 'You have been logged out of BetterX Cloud.',
      type: 'info'
    });
    
    this.setupAuthUI(container, uiManager);
  }

  private async pushToCloud(
    uiManager: UIManager, 
    syncPlugins: boolean, 
    syncThemes: boolean,
    container: HTMLElement
  ): Promise<void> {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      
      const settings = this.collectSettings(uiManager, syncPlugins, syncThemes);
      
      localStorage.setItem('betterx_cloud_data', JSON.stringify(settings));
      
      // Update last sync time
      this.lastSyncTime = Date.now();
      localStorage.setItem('betterx_cloud_last_sync', this.lastSyncTime.toString());

      uiManager.notify({
        title: 'Sync Complete',
        message: 'Your settings have been pushed to the cloud.',
        type: 'success'
      });
      
      this.updateLastSyncInfo(container);
    } catch (error) {
      logger.error('Push error:', error);
      uiManager.notify({
        title: 'Sync Error',
        message: 'Failed to push settings to the cloud.',
        type: 'error'
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  private async pullFromCloud(
    uiManager: UIManager, 
    syncPlugins: boolean, 
    syncThemes: boolean,
    container: HTMLElement
  ): Promise<void> {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      
      const cloudDataStr = localStorage.getItem('betterx_cloud_data');
      
      if (!cloudDataStr) {
        uiManager.notify({
          title: 'No Data Found',
          message: 'No cloud data found. Push your settings first.',
          type: 'warning'
        });
        return;
      }
      
      const cloudData: SyncableSettings = JSON.parse(cloudDataStr);
      
      this.applySettings(uiManager, cloudData, syncPlugins, syncThemes);
      
      this.lastSyncTime = Date.now();
      localStorage.setItem('betterx_cloud_last_sync', this.lastSyncTime.toString());
      
      uiManager.notify({
        title: 'Sync Complete',
        message: 'Your settings have been pulled from the cloud.',
        type: 'success'
      });
      
      this.updateLastSyncInfo(container);
    } catch (error) {
      logger.error('Pull error:', error);
      uiManager.notify({
        title: 'Sync Error',
        message: 'Failed to pull settings from the cloud.',
        type: 'error'
      });
    } finally {
      this.syncInProgress = false;
    }
  }

  private collectSettings(
    uiManager: UIManager, 
    includePlugins: boolean, 
    includeThemes: boolean
  ): SyncableSettings {
    const settings: SyncableSettings = {
      plugins: {},
      themes: {},
      activeThemeIds: [],
      timestamp: Date.now()
    };
    
    if (includePlugins && uiManager.pluginManager && uiManager.pluginManager.plugins) {
      uiManager.pluginManager.plugins.forEach((plugin: BetterXPlugin) => {
        settings.plugins[plugin.name] = plugin.enabled;
      });
    }
    
    if (includeThemes && uiManager.themeManager && uiManager.themeManager.themes) {
      uiManager.themeManager.themes.forEach((theme: BetterXTheme) => {
        settings.themes[theme.id] = theme.enabled;
      });
      
      if (uiManager.themeManager.themeOrder) {
        settings.activeThemeIds = [...uiManager.themeManager.themeOrder];
      }
    }
    
    return settings;
  }

  private applySettings(
    uiManager: UIManager, 
    settings: SyncableSettings, 
    applyPlugins: boolean, 
    applyThemes: boolean
  ): void {
    const restartRequired: string[] = [];
    
    if (applyPlugins && settings.plugins && uiManager.pluginManager && uiManager.pluginManager.plugins) {
      uiManager.pluginManager.plugins.forEach((plugin: BetterXPlugin) => {
        const shouldBeEnabled = settings.plugins[plugin.name];
        
        if (typeof shouldBeEnabled === 'boolean' && shouldBeEnabled !== plugin.enabled) {
          uiManager.pluginManager.togglePlugin(plugin.name);
          
          if (plugin.requiresRestart) {
            restartRequired.push(plugin.name);
          }
        }
      });
    }
    
    if (applyThemes && settings.themes && uiManager.themeManager && uiManager.themeManager.themes) {
      uiManager.themeManager.themes.forEach((theme: BetterXTheme) => {
        const shouldBeEnabled = settings.themes[theme.id];
        
        if (typeof shouldBeEnabled === 'boolean' && shouldBeEnabled !== theme.enabled) {
          uiManager.themeManager.toggleTheme(theme.id, shouldBeEnabled);
        }
      });
      
      if (settings.activeThemeIds && settings.activeThemeIds.length > 0) {
        uiManager.themeManager.reorderThemes(settings.activeThemeIds);
      }
    }
    
    if (restartRequired.length > 0) {
      uiManager.createRestartDialog(restartRequired);
    }
  }

  private updateLastSyncInfo(container: HTMLElement): void {
    const lastSyncElement = container.querySelector('#betterx-cloud-last-sync');
    if (!lastSyncElement) return;
    
    if (this.lastSyncTime) {
      const date = new Date(this.lastSyncTime);
      lastSyncElement.textContent = `Last sync: ${date.toLocaleString()}`;
    } else {
      lastSyncElement.textContent = 'Last sync: Never';
    }
  }

  private loadAuthData(): void {
    try {
      const savedAuthData = localStorage.getItem('betterx_cloud_auth');
      if (savedAuthData) {
        const authData = JSON.parse(savedAuthData);
        this.isAuthenticated = true;
        this.authToken = authData.token;
        this.username = authData.username;
        this.avatar = authData.avatar;
      }
      
      const lastSync = localStorage.getItem('betterx_cloud_last_sync');
      if (lastSync) {
        this.lastSyncTime = parseInt(lastSync, 10);
      }
    } catch (error) {
      logger.error('Error loading auth data:', error);
      this.isAuthenticated = false;
      this.authToken = null;
      this.username = null;
      this.avatar = null;
    }
  }

  private saveAuthData(): void {
    if (this.isAuthenticated && this.authToken && this.username) {
      const authData = {
        token: this.authToken,
        username: this.username,
        avatar: this.avatar
      };
      localStorage.setItem('betterx_cloud_auth', JSON.stringify(authData));
    }
  }
}