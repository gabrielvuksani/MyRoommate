import { supabase } from './supabase';
import { nanoid } from 'nanoid';

// Upload profile image to Supabase Storage
export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${nanoid()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(`public/${fileName}`, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data } = supabase.storage
    .from('profile-images')
    .getPublicUrl(`public/${fileName}`);

  return data.publicUrl;
}

// Delete profile image from Supabase Storage
export async function deleteProfileImage(url: string): Promise<void> {
  // Extract file path from URL
  const urlParts = url.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const filePath = `public/${fileName}`;
  
  const { error } = await supabase.storage
    .from('profile-images')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting image:', error);
    // Don't throw here as this is often not critical
  }
}

// Upload roommate listing images
export async function uploadRoommateImages(files: File[], listingId: string): Promise<string[]> {
  const uploadPromises = files.map(async (file, index) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${listingId}-${index}-${nanoid()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('roommate-images')
      .upload(`public/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage
      .from('roommate-images')
      .getPublicUrl(`public/${fileName}`);

    return data.publicUrl;
  });

  return Promise.all(uploadPromises);
}

// Delete roommate listing images
export async function deleteRoommateImages(urls: string[]): Promise<void> {
  const filePaths = urls.map(url => {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    return `public/${fileName}`;
  });
  
  const { error } = await supabase.storage
    .from('roommate-images')
    .remove(filePaths);

  if (error) {
    console.error('Error deleting images:', error);
    // Don't throw here as this is often not critical
  }
}