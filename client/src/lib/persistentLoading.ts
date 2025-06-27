// Persistent loading overlay that survives page refreshes
export class PersistentLoading {
  private static overlayId = 'persistent-loading-overlay';
  
  static show(message: string) {
    // Store loading state in sessionStorage
    sessionStorage.setItem('persistentLoading', JSON.stringify({
      active: true,
      message,
      timestamp: Date.now()
    }));
    
    // Create or update overlay
    this.createOverlay(message);
  }
  
  static hide() {
    // Remove from sessionStorage
    sessionStorage.removeItem('persistentLoading');
    
    // Remove overlay from DOM
    const overlay = document.getElementById(this.overlayId);
    if (overlay) {
      overlay.remove();
    }
  }
  
  static checkAndShow() {
    // Check if loading should be active on page load
    const loadingData = sessionStorage.getItem('persistentLoading');
    if (loadingData) {
      try {
        const { active, message, timestamp } = JSON.parse(loadingData);
        
        // Only show if loading is recent (within 10 seconds)
        if (active && (Date.now() - timestamp) < 10000) {
          this.createOverlay(message);
          
          // Auto-hide after 3 seconds for safety
          setTimeout(() => {
            this.hide();
          }, 3000);
        } else {
          // Clean up old loading state
          sessionStorage.removeItem('persistentLoading');
        }
      } catch (err) {
        // Clean up invalid data
        sessionStorage.removeItem('persistentLoading');
      }
    }
  }
  
  private static createOverlay(message: string) {
    // Remove existing overlay if present
    const existing = document.getElementById(this.overlayId);
    if (existing) {
      existing.remove();
    }
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.id = this.overlayId;
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.05);
      backdrop-filter: blur(8px) saturate(1.2);
      -webkit-backdrop-filter: blur(8px) saturate(1.2);
      pointer-events: all;
    `;
    
    // Create modal container
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: relative;
      overflow: hidden;
      border-radius: 24px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      min-width: 280px;
      max-width: 320px;
      background: var(--surface-overlay, rgba(255, 255, 255, 0.9));
      backdrop-filter: blur(30px) saturate(1.8);
      -webkit-backdrop-filter: blur(30px) saturate(1.8);
      border: 1px solid var(--border, rgba(255, 255, 255, 0.2));
      animation: modal-enter 0.2s ease-out;
      margin-top: 10vh;
    `;
    
    // Create content
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    `;
    
    // Create spinner
    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 24px;
      height: 24px;
      border: 2px solid transparent;
      border-top: 2px solid #007AFF;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;
    
    // Create message
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      text-align: center;
      font-weight: 500;
      font-size: 18px;
      line-height: 1.5;
      margin: 0;
      color: var(--text-primary, #1a1a1a);
    `;
    
    // Add spinner animation styles if not already present
    if (!document.getElementById('spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes modal-enter {
          0% { 
            opacity: 0; 
            transform: scale(0.95) translateY(10px); 
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Assemble elements
    content.appendChild(spinner);
    content.appendChild(messageEl);
    modal.appendChild(content);
    overlay.appendChild(modal);
    
    // Add to DOM
    document.body.appendChild(overlay);
  }
}