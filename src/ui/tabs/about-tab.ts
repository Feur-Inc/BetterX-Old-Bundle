import { SettingsTab } from './tab-interface';
import { UIManager } from '../types';

/**
 * Example implementation of a new About tab
 * This demonstrates how easy it is to add new tabs to the system
 */
export class AboutTab implements SettingsTab {
  id = 'about';
  name = 'About';
  priority = 100; // Higher number means it appears later in the tab list

  getContent(): string {
    return `
      <div id="betterx-about-tab" class="betterx-tab-content">
        <div class="betterx-about-container">
          <div class="betterx-about-header">
            <h2>About BetterX</h2>
            <p>A browser extension to make your X experience better.</p>
          </div>
          
          <div class="betterx-about-section">
            <h3>Contributors</h3>
            <div id="betterx-contributors-list">
              <!-- Will be populated dynamically -->
            </div>
          </div>
          
          <div class="betterx-about-section">
            <h3>Resources</h3>
            <ul class="betterx-resources-list">
              <li><a href="https://github.com/yourusername/BetterX" target="_blank">GitHub Repository</a></li>
              <li><a href="https://github.com/yourusername/BetterX/issues" target="_blank">Report Issues</a></li>
              <li><a href="https://github.com/yourusername/BetterX/wiki" target="_blank">Documentation</a></li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  initialize(container: HTMLElement, uiManager: UIManager): void {
    this.populateContributors(container, uiManager);
  }

  onActivate(container: HTMLElement, uiManager: UIManager): void {
    // Nothing special needed on reactivation
  }

  private populateContributors(container: HTMLElement, uiManager: UIManager): void {
    const contributorsList = container.querySelector('#betterx-contributors-list');
    if (!contributorsList) return;
    
    // Create a sample list of contributors
    // In a real implementation, this could come from a JSON file or API
    const contributors = [
      { name: 'Developer 1', handle: 'dev1', avatar: '' },
      { name: 'Developer 2', handle: 'dev2', avatar: '' },
      { name: 'Developer 3', handle: 'dev3', avatar: '' }
    ];
    
    // Create contributor elements
    const contributorElements = contributors.map(contributor => {
      const contributorElement = document.createElement('div');
      contributorElement.className = 'betterx-contributor';
      
      contributorElement.innerHTML = `
        <div class="betterx-contributor-info">
          <h4>${contributor.name}</h4>
          <a href="https://twitter.com/${contributor.handle}" target="_blank">@${contributor.handle}</a>
        </div>
      `;
      
      return contributorElement;
    });
    
    // Add contributors to the list
    contributorElements.forEach(element => {
      contributorsList.appendChild(element);
    });
    
    // Add some styles specifically for this tab
    this.addStyles();
  }

  private addStyles(): void {
    // Create styles specific to the About tab if they don't exist yet
    if (!document.getElementById('betterx-about-styles')) {
      const styles = document.createElement('style');
      styles.id = 'betterx-about-styles';
      styles.textContent = `
        .betterx-about-container {
          max-width: 100%;
          padding: 0 16px;
        }
        
        .betterx-about-header {
          margin-bottom: 24px;
          border-bottom: 1px solid var(--betterx-borderColor);
          padding-bottom: 16px;
        }
        
        .betterx-about-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
        }
        
        .betterx-about-header p {
          margin: 0;
          color: var(--betterx-textColorSecondary);
        }
        
        .betterx-about-section {
          margin-bottom: 24px;
        }
        
        .betterx-about-section h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }
        
        .betterx-contributor {
          display: flex;
          align-items: center;
          padding: 12px;
          border-radius: 8px;
          background-color: var(--betterx-pluginDetailsBg);
          margin-bottom: 8px;
        }
        
        .betterx-contributor-info h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
        }
        
        .betterx-contributor-info a {
          color: var(--betterx-accentColor);
          text-decoration: none;
        }
        
        .betterx-contributor-info a:hover {
          text-decoration: underline;
        }
        
        .betterx-resources-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        
        .betterx-resources-list li {
          margin-bottom: 12px;
        }
        
        .betterx-resources-list a {
          color: var(--betterx-accentColor);
          text-decoration: none;
          display: inline-block;
          padding: 8px 0;
        }
        
        .betterx-resources-list a:hover {
          text-decoration: underline;
        }
      `;
      document.head.appendChild(styles);
    }
  }
}