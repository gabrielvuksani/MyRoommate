import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { getProfileInitials } from "@/lib/nameUtils";
import { ProfileColorPicker } from "@/components/ProfileColorPicker";

const gradientClasses = {
  blue: 'from-blue-400 to-indigo-600',
  purple: 'from-purple-400 to-pink-600',
  green: 'from-green-400 to-emerald-600',
  orange: 'from-orange-400 to-red-600',
  pink: 'from-pink-400 to-rose-600',
  teal: 'from-teal-400 to-cyan-600'
};

interface SimpleAvatarSelectorProps {
  firstName: string;
  lastName: string;
  email: string;
  profileColor: string;
  profileImage: File | null;
  onColorChange: (color: string) => void;
  onImageChange: (file: File | null) => void;
  compact?: boolean;
}

export function SimpleAvatarSelector({
  firstName,
  lastName, 
  email,
  profileColor,
  profileImage,
  onColorChange,
  onImageChange,
  compact = false
}: SimpleAvatarSelectorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const initials = getProfileInitials(firstName, lastName, email);
  const imageUrl = profileImage ? URL.createObjectURL(profileImage) : null;
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be smaller than 5MB');
        return;
      }
      onImageChange(file);
    }
    event.target.value = '';
  };

  if (compact) {
    return (
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          <Avatar className="w-16 h-16">
            {imageUrl ? (
              <AvatarImage src={imageUrl} alt="Profile preview" className="object-cover" />
            ) : (
              <AvatarFallback className={`bg-gradient-to-br ${gradientClasses[profileColor as keyof typeof gradientClasses] || gradientClasses.blue} text-white font-bold text-lg border-0`}>
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            onClick={() => document.getElementById('avatar-upload')?.click()}
            size="sm"
            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full p-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Camera size={12} />
          </Button>
        </div>

        {imageUrl && (
          <Button
            type="button"
            onClick={() => onImageChange(null)}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
          >
            <X size={12} className="mr-1" />
            Remove
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex justify-center">
        <div className="relative">
          <Avatar className="w-20 h-20">
            {imageUrl ? (
              <AvatarImage src={imageUrl} alt="Profile preview" className="object-cover" />
            ) : (
              <AvatarFallback className={`bg-gradient-to-br ${gradientClasses[profileColor as keyof typeof gradientClasses] || gradientClasses.blue} text-white font-bold text-xl border-0`}>
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          
          <input
            type="file"
            id="avatar-upload-full"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            onClick={() => document.getElementById('avatar-upload-full')?.click()}
            size="sm"
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Camera size={14} />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {imageUrl && (
          <Button
            type="button"
            onClick={() => onImageChange(null)}
            variant="ghost"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
          >
            <X size={16} className="mr-2" />
            Remove Photo
          </Button>
        )}

        <div className="space-y-2">
          <Button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            variant="ghost"
            className="w-full justify-start"
          >
            <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${gradientClasses[profileColor as keyof typeof gradientClasses] || gradientClasses.blue} mr-2`} />
            Change Color
          </Button>
          
          {showColorPicker && (
            <ProfileColorPicker
              selectedColor={profileColor}
              onColorChange={onColorChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}