import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, User } from 'lucide-react';
import { getProfileInitials } from '@/lib/nameUtils';
import { ProfileColorPicker } from './ProfileColorPicker';

interface SignupAvatarSelectorProps {
  firstName: string;
  lastName: string;
  email: string;
  profileColor: string;
  profileImage: File | null;
  onColorChange: (color: string) => void;
  onImageChange: (file: File | null) => void;
  compact?: boolean;
}

const gradientClasses = {
  blue: 'from-blue-400 to-blue-600',
  emerald: 'from-emerald-400 to-cyan-400',
  purple: 'from-purple-400 to-pink-600',
  orange: 'from-orange-400 to-red-500',
  indigo: 'from-indigo-400 to-purple-600',
  green: 'from-green-400 to-emerald-600',
  pink: 'from-pink-400 to-rose-600',
  teal: 'from-teal-400 to-cyan-600'
};

export function SignupAvatarSelector({
  firstName,
  lastName,
  email,
  profileColor,
  profileImage,
  onColorChange,
  onImageChange,
  compact = false
}: SignupAvatarSelectorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const initials = getProfileInitials(firstName, lastName, email);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image must be smaller than 5MB');
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      onImageChange(file);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    onImageChange(null);
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Avatar Preview */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="w-16 h-16">
              {imagePreviewUrl ? (
                <AvatarImage 
                  src={imagePreviewUrl} 
                  alt="Profile preview"
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className={`bg-gradient-to-br ${gradientClasses[profileColor as keyof typeof gradientClasses] || gradientClasses.blue} text-white font-bold text-lg border-0`}>
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            
            <button
              onClick={() => document.getElementById('signup-avatar-input')?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full p-0 shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
              style={{
                background: 'var(--surface)',
                border: '2px solid var(--surface)',
                color: 'var(--text-secondary)'
              }}
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          id="signup-avatar-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Compact action buttons */}
        <div className="space-y-2">
          {imagePreviewUrl ? (
            <button 
              onClick={handleRemoveImage}
              className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] text-red-500 hover:text-red-600"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)'
              }}
            >
              <X className="w-3 h-3 mr-2" />
              Remove
            </button>
          ) : (
            <button 
              onClick={() => document.getElementById('signup-avatar-input')?.click()}
              className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
              style={{
                background: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)'
              }}
            >
              <Upload className="w-3 h-3 mr-2" />
              Upload
            </button>
          )}
          
          <button 
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-full flex items-center justify-center px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'var(--surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)'
            }}
          >
            {showColorPicker ? 'Hide Colors' : 'Colors'}
          </button>
        </div>

        {/* Color picker */}
        {showColorPicker && (
          <div className="pt-2">
            <ProfileColorPicker
              selectedColor={profileColor}
              onColorChange={onColorChange}
              size="sm"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Profile Picture
            </h3>
          </div>
          
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Add a photo or choose a color for your avatar (optional)
          </p>

          {/* Avatar Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {imagePreviewUrl ? (
                  <AvatarImage 
                    src={imagePreviewUrl} 
                    alt="Profile preview"
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className={`bg-gradient-to-br ${gradientClasses[profileColor as keyof typeof gradientClasses] || gradientClasses.blue} text-white font-bold text-2xl border-0`}>
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <Button
                variant="outline"
                size="sm"
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-800 shadow-lg hover:scale-110 transition-transform"
                onClick={() => document.getElementById('signup-avatar-input')?.click()}
              >
                <Camera className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            id="signup-avatar-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Action buttons */}
          <div className="space-y-3">
            {imagePreviewUrl ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRemoveImage}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Remove Photo
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => document.getElementById('signup-avatar-input')?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photo
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-full"
            >
              {showColorPicker ? 'Hide Colors' : 'Choose Avatar Color'}
            </Button>
          </div>

          {/* Color picker */}
          {showColorPicker && (
            <div className="pt-2">
              <ProfileColorPicker
                selectedColor={profileColor}
                onColorChange={onColorChange}
                size="md"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}