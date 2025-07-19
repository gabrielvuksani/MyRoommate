import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "auto";

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("auto");
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Initialize theme from localStorage or default to auto
    const saved = localStorage.getItem("theme") as Theme;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    if (saved && (saved === "light" || saved === "dark" || saved === "auto")) {
      setTheme(saved);
    } else {
      setTheme("auto");
    }

    // Set initial effective theme
    setEffectiveTheme(mediaQuery.matches ? "dark" : "light");

    // Listen for system theme changes
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setEffectiveTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const appliedTheme = theme === 'auto' ? effectiveTheme : theme;
    
    // Remove both classes first
    root.classList.remove("light", "dark");
    
    // Add the current theme class
    root.classList.add(appliedTheme);
    
    // Update theme-color meta tag for iPhone status bar
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', appliedTheme === 'dark' ? '#1c1c1e' : '#f7f8fa');
    }
    
    // Update apple-mobile-web-app-status-bar-style for iPhone
    const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (statusBarMeta) {
      statusBarMeta.setAttribute('content', appliedTheme === 'dark' ? 'black-translucent' : 'default');
    }
    
    // Update PWA manifest theme-color dynamically
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      // Create a new manifest with updated theme color
      fetch(manifestLink.href)
        .then(response => response.json())
        .then(manifest => {
          manifest.theme_color = appliedTheme === 'dark' ? '#1c1c1e' : '#f7f8fa';
          manifest.background_color = appliedTheme === 'dark' ? '#1c1c1e' : '#f7f8fa';
          
          const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
          const newManifestURL = URL.createObjectURL(blob);
          manifestLink.href = newManifestURL;
        })
        .catch(() => {
          // Fallback: just update the theme-color meta tag
        });
    }
    
    // Notify service worker of theme change
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'THEME_CHANGED',
        theme: appliedTheme
      });
    }
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme, effectiveTheme]);

  const toggleTheme = () => {
    if (theme === "auto") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("auto");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}