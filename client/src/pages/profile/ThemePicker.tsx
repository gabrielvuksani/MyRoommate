import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

interface ThemePickerProps {
  theme: string;
  effectiveTheme: string;
  setTheme: (theme: "auto" | "light" | "dark") => void;
}

export default function ThemePicker({ theme, effectiveTheme, setTheme }: ThemePickerProps) {
  return (
    <div className="pt-6 mt-6" style={{ borderTop: '1px solid var(--border)' }}>
      <h4 className="text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
        Appearance
      </h4>
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
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-orange-400 to-blue-500 relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-800 rounded-full" style={{ 
              clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)' 
            }}></div>
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
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-sm">
            <Sun size={16} className="text-white drop-shadow-sm" />
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
  );
}