import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, X, Upload, Palette, Check, AlertCircle } from 'lucide-react';
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
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const queryClient = useQueryClient();

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
      // Invalidate all user-related queries for real-time updates everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/households/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setShowUploadOptions(false);
      setImageRemoved(false); // Reset after successful deletion
    },
    onError: (error) => {
      console.error('Profile image removal failed:', error);
      setImageRemoved(false); // Reset on error
    }
  });

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
      // Invalidate all user-related queries for real-time updates everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/households/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setShowUploadOptions(false);
      setUploading(false);
      setLocalImageUrl(null); // Clear local preview after successful upload
      setImageRemoved(false);
    },
    onError: (error) => {
      console.error('Profile image upload failed:', error);
      setUploading(false);
      setLocalImageUrl(null); // Clear local preview on error
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  // Reset success states after a delay and hide upload options
  React.useEffect(() => {
    if (uploadMutation.isSuccess || deleteMutation.isSuccess) {
      const timer = setTimeout(() => {
        uploadMutation.reset();
        deleteMutation.reset();
        setShowUploadOptions(false); // Auto-hide after success
      }, 1500); // Reduced delay for snappier feedback
      return () => clearTimeout(timer);
    }
  }, [uploadMutation.isSuccess, deleteMutation.isSuccess, uploadMutation.reset, deleteMutation.reset]);

  const updateColorMutation = useMutation({
    mutationFn: async (color: string) => {
      return apiRequest('PATCH', '/api/user', { profileColor: color });
    },
    onSuccess: () => {
      // Invalidate all user-related queries for real-time updates everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/households/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setShowColorPicker(false);
      // Reset success state after 2 seconds
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/households/current'] });
      }, 2000);
    },
    onError: (error) => {
      console.error('Profile color update failed:', error);
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
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
      // Create local preview for immediate feedback
      const previewUrl = URL.createObjectURL(file);
      setLocalImageUrl(previewUrl);
      setImageRemoved(false);
      uploadMutation.mutate(file);
    }
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleRemoveImage = () => {
    // Immediately show fallback for real-time feedback
    setImageRemoved(true);
    setLocalImageUrl(null);
    // Call the delete mutation to update the server
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

  // Determine what image to show based on local state and user data
  const displayImageUrl = localImageUrl || (!imageRemoved ? user.profileImageUrl : null);
  const shouldShowImage = displayImageUrl && !imageRemoved;

  return (
    <div className="relative inline-block">
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        {shouldShowImage ? (
          <AvatarImage 
            src={displayImageUrl} 
            alt={`${user.firstName || user.email}'s profile`}
            className="object-cover"
            onError={() => {
              // If image fails to load, show fallback
              setImageRemoved(true);
              setLocalImageUrl(null);
            }}
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
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-800 shadow-lg hover:scale-110 transition-all duration-200"
            onClick={() => setShowUploadOptions(!showUploadOptions)}
            disabled={uploading || uploadMutation.isPending || deleteMutation.isPending}
          >
            {uploading || uploadMutation.isPending || deleteMutation.isPending || updateColorMutation.isPending ? (
              <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            ) : uploadMutation.isSuccess || deleteMutation.isSuccess || updateColorMutation.isSuccess ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : uploadMutation.isError || deleteMutation.isError || updateColorMutation.isError ? (
              <AlertCircle className="w-3 h-3 text-red-500" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
          </Button>

          {showUploadOptions && (
            <div 
              className="absolute top-full left-0 mt-2 rounded-2xl shadow-lg border p-3 z-50 min-w-48 animate-in fade-in-0 zoom-in-95 duration-200"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                backgroundColor: 'rgba(var(--surface-rgb), 0.85)'
              }}
            >
              <div className="space-y-2">
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-full flex items-center justify-start px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer"
                    style={{
                      background: 'var(--surface-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </div>
                </label>
                
                {user.profileImageUrl && (
                  <button 
                    className="w-full flex items-center justify-start px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-md text-red-500 hover:text-red-600"
                    onClick={handleRemoveImage}
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Photo
                  </button>
                )}
                
                <button 
                  className="w-full flex items-center justify-start px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  onClick={() => {
                    setShowUploadOptions(false);
                    setShowColorPicker(true);
                  }}
                  style={{
                    background: 'var(--surface-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Change Color
                </button>
              </div>
            </div>
          )}

          {showColorPicker && (
            <div 
              className="absolute top-full left-0 mt-2 rounded-2xl shadow-lg border p-4 z-50 min-w-64"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                backgroundColor: 'rgba(var(--surface-rgb), 0.9)'
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Avatar Color
                  </h4>
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                    style={{
                      background: 'var(--surface-secondary)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
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