import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

interface ThemeSelectorProps {
  theme: string;
  effectiveTheme: string | null;
  setTheme: (theme: string) => void;
}

export const ThemeSelector = React.memo(({ theme, effectiveTheme, setTheme }: ThemeSelectorProps) => {
  return (
    <Card className="glass-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)'
    }}>
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Appearance
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => setTheme("auto")}
              className={`h-20 rounded-2xl font-medium flex flex-col items-center justify-center space-y-2 transition-all border-2 ${
                theme === 'auto' ? 'border-blue-500 shadow-lg' : 'border-transparent'
              }`}
              style={{
                background: theme === 'auto' ? 'var(--primary)' : 'var(--surface-secondary)',
                color: theme === 'auto' ? '#ffffff' : 'var(--text-primary)'
              }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-white to-slate-700 flex items-center justify-center shadow-sm">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-white via-gray-200 to-gray-900" />
              </div>
              <span className="text-xs font-semibold">Auto</span>
            </Button>
            <Button
              onClick={() => setTheme("light")}
              className={`h-20 rounded-2xl font-medium flex flex-col items-center justify-center space-y-2 transition-all border-2 ${
                theme === 'light' ? 'border-blue-500 shadow-lg' : 'border-transparent'
              }`}
              style={{
                background: theme === 'light' ? 'var(--primary)' : 'var(--surface-secondary)',
                color: theme === 'light' ? '#ffffff' : 'var(--text-primary)'
              }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-200 to-orange-300 flex items-center justify-center shadow-sm">
                <Sun size={16} className="text-orange-600 drop-shadow-sm" />
              </div>
              <span className="text-xs font-semibold">Light</span>
            </Button>
            <Button
              onClick={() => setTheme("dark")}
              className={`h-20 rounded-2xl font-medium flex flex-col items-center justify-center space-y-2 transition-all border-2 ${
                theme === 'dark' ? 'border-blue-500 shadow-lg' : 'border-transparent'
              }`}
              style={{
                background: theme === 'dark' ? 'var(--primary)' : 'var(--surface-secondary)',
                color: theme === 'dark' ? '#ffffff' : 'var(--text-primary)'
              }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-sm">
                <Moon size={16} className="text-slate-300 drop-shadow-sm" />
              </div>
              <span className="text-xs font-semibold">Dark</span>
            </Button>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
            {theme === 'auto' 
              ? `Following system (currently ${effectiveTheme || 'light'})`
              : `Using ${theme} mode`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

ThemeSelector.displayName = 'ThemeSelector';