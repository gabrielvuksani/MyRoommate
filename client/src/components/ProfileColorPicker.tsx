import React from 'react';
import { Check } from 'lucide-react';

interface ProfileColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const colorOptions = [
  { name: 'blue', class: 'from-blue-400 to-blue-600', bg: 'bg-gradient-to-br from-blue-400 to-blue-600' },
  { name: 'emerald', class: 'from-emerald-400 to-cyan-400', bg: 'bg-gradient-to-br from-emerald-400 to-cyan-400' },
  { name: 'purple', class: 'from-purple-400 to-pink-600', bg: 'bg-gradient-to-br from-purple-400 to-pink-600' },
  { name: 'orange', class: 'from-orange-400 to-red-500', bg: 'bg-gradient-to-br from-orange-400 to-red-500' },
  { name: 'indigo', class: 'from-indigo-400 to-purple-600', bg: 'bg-gradient-to-br from-indigo-400 to-purple-600' },
  { name: 'green', class: 'from-green-400 to-emerald-600', bg: 'bg-gradient-to-br from-green-400 to-emerald-600' },
  { name: 'pink', class: 'from-pink-400 to-rose-600', bg: 'bg-gradient-to-br from-pink-400 to-rose-600' },
  { name: 'teal', class: 'from-teal-400 to-cyan-600', bg: 'bg-gradient-to-br from-teal-400 to-cyan-600' }
];

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10', 
  lg: 'w-12 h-12'
};

export function ProfileColorPicker({ 
  selectedColor, 
  onColorChange, 
  size = 'md',
  fullWidth = false
}: ProfileColorPickerProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-center" style={{ color: 'var(--text-primary)' }}>
        Avatar Color
      </p>
      <div className="w-full flex justify-center">
        <div className={`grid gap-4 ${fullWidth ? 'grid-cols-8 w-full' : 'grid-cols-4 w-auto'}`}>
          {colorOptions.map((color) => (
            <button
              key={color.name}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onColorChange(color.name);
              }}
              className={`${sizeClasses[size]} ${color.bg} rounded-full relative transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              title={color.name}
            >
              {selectedColor === color.name && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} className="text-white drop-shadow-lg" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}