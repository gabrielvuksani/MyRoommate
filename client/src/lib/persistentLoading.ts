// Persistent loading overlay that survives page refreshes
const LOADING_KEY = "app_loading";
const LOADING_MESSAGE_KEY = "app_loading_message";

export const PersistentLoading = {
  show: (message?: string) => {
    sessionStorage.setItem(LOADING_KEY, "true");
    if (message) {
      sessionStorage.setItem(LOADING_MESSAGE_KEY, message);
    }

    // Immediately show loading overlay
    showLoadingOverlay(message);
  },

  hide: () => {
    sessionStorage.removeItem(LOADING_KEY);
    sessionStorage.removeItem(LOADING_MESSAGE_KEY);

    // Remove loading overlay
    hideLoadingOverlay();
  },

  isShowing: () => {
    return sessionStorage.getItem(LOADING_KEY) === "true";
  },

  getMessage: () => {
    return sessionStorage.getItem(LOADING_MESSAGE_KEY) || "";
  },

  // Check and show on page load
  checkAndShow: () => {
    if (PersistentLoading.isShowing()) {
      const message = PersistentLoading.getMessage();
      showLoadingOverlay(message);

      // Auto-hide after timeout to prevent infinite loading
      setTimeout(() => {
        PersistentLoading.hide();
      }, 2000);
    }
  },
};

// DOM manipulation for loading overlay
function showLoadingOverlay(message?: string) {
  // Remove existing overlay if any
  hideLoadingOverlay();

  // Create overlay element
  const overlay = document.createElement("div");
  overlay.id = "persistent-loading-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Create content container
  const content = document.createElement("div");
  content.style.cssText = `
    background: rgba(255, 255, 255, 0.9);
    border-radius: 24px;
    padding: 32px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    text-align: center;
    min-width: 200px;
  `;

  // Add spinner
  const spinner = document.createElement("div");
  spinner.style.cssText = `
    width: 48px;
    height: 48px;
    border: 3px solid rgba(79, 209, 197, 0.2);
    border-top-color: rgb(79, 209, 197);
    border-radius: 50%;
    margin: 0 auto 16px;
    animation: spin 0.8s linear infinite;
  `;

  // Add message
  if (message) {
    const text = document.createElement("p");
    text.style.cssText = `
      color: #1a1a1a;
      font-size: 16px;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    text.textContent = message;
    content.appendChild(text);
  }

  // Add CSS animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    @media (prefers-color-scheme: dark) {
      #persistent-loading-overlay > div {
        background: rgba(30, 30, 30, 0.9) !important;
      }
      #persistent-loading-overlay p {
        color: white !important;
      }
    }
  `;
  document.head.appendChild(style);

  content.prepend(spinner);
  overlay.appendChild(content);
  document.body.appendChild(overlay);
}

function hideLoadingOverlay() {
  const overlay = document.getElementById("persistent-loading-overlay");
  if (overlay) {
    overlay.remove();
  }
}
