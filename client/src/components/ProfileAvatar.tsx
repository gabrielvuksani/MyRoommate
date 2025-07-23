import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, X, Upload, Palette } from 'lucide-react';
import { getProfileInitials } from '@/lib/nameUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { ProfileColorPicker } from './ProfileColorPicker';

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
  profileColor?: string | null;
}

interface ProfileAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  className?: string;
  gradientType?: 'blue' | 'emerald' | 'purple' | 'orange' | 'indigo' | 'green' | 'pink' | 'teal';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-2xl'
};

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

export function ProfileAvatar({ 
  user, 
  size = 'md', 
  editable = false, 
  className = '',
  gradientType = 'blue'
}: ProfileAvatarProps) {
  const [uploading, setUploading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await fetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setShowUploadOptions(false);
    },
    onError: (error) => {
      console.error('Profile image upload failed:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/profile-image', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setShowUploadOptions(false);
    }
  });

  const updateColorMutation = useMutation({
    mutationFn: async (color: string) => {
      const response = await apiRequest('PATCH', '/api/user', { profileColor: color });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setShowColorPicker(false);
    }
  });

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
      
      setUploading(true);
      uploadMutation.mutate(file);
    }
  };

  const handleRemoveImage = () => {
    deleteMutation.mutate();
  };

  const handleColorChange = (color: string) => {
    updateColorMutation.mutate(color);
  };

  const initials = getProfileInitials(user.firstName, user.lastName, user.email);
  
  // Use user's profileColor if available, otherwise fallback to gradientType
  const colorKey = (user.profileColor && gradientClasses[user.profileColor as keyof typeof gradientClasses]) 
    ? user.profileColor as keyof typeof gradientClasses
    : gradientType;

  return (
    <div className="relative inline-block">
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        {user.profileImageUrl ? (
          <AvatarImage 
            src={user.profileImageUrl} 
            alt={`${user.firstName || user.email}'s profile`}
            className="object-cover"
          />
        ) : (
          <AvatarFallback className={`bg-gradient-to-br ${gradientClasses[colorKey]} text-white font-bold border-0`}>
            {initials}
          </AvatarFallback>
        )}
      </Avatar>

      {editable && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-800 shadow-lg hover:scale-110 transition-transform"
            onClick={() => setShowUploadOptions(!showUploadOptions)}
            disabled={uploading || uploadMutation.isPending || deleteMutation.isPending}
          >
            {uploading || uploadMutation.isPending || deleteMutation.isPending ? (
              <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
          </Button>

          {showUploadOptions && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-50 min-w-40">
              <div className="space-y-2">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button variant="ghost" size="sm" className="w-full justify-start text-left" asChild>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </span>
                  </Button>
                </label>
                
                {user.profileImageUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleRemoveImage}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Photo
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    setShowUploadOptions(false);
                    setShowColorPicker(true);
                  }}
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Change Color
                </Button>
              </div>
            </div>
          )}

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50 min-w-64">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Avatar Color
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowColorPicker(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                <ProfileColorPicker
                  selectedColor={user.profileColor || 'blue'}
                  onColorChange={handleColorChange}
                  size="md"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Quick avatar component for use throughout the app without editing functionality
export function QuickAvatar({ 
  user, 
  size = 'md', 
  className = '',
  gradientType = 'blue'
}: Omit<ProfileAvatarProps, 'editable'>) {
  return (
    <ProfileAvatar 
      user={user} 
      size={size} 
      className={className} 
      gradientType={gradientType} 
      editable={false} 
    />
  );
}