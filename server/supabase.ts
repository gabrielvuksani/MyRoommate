import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
}

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Client with anon key for public operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY!
);

// Storage bucket name for roommate listing images
export const STORAGE_BUCKET = 'roommate-images';

// Initialize storage bucket
export async function initializeStorage() {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      // Create the bucket with public access
      const { error: bucketError } = await supabaseAdmin.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (bucketError) {
        console.error('Error creating storage bucket:', bucketError);
      } else {
        console.log(`Created storage bucket: ${STORAGE_BUCKET}`);
      }
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Upload image to Supabase storage
export async function uploadImage(file: Buffer, fileName: string, contentType: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

// Delete image from Supabase storage
export async function deleteImage(fileName: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([fileName]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}