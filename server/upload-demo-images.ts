import { promises as fs } from 'fs';
import path from 'path';
import { uploadImage } from './supabase';
import { storage } from './storage';

// Upload all demo images to Supabase and update database
async function uploadDemoImages() {
  console.log('Starting demo image upload to Supabase...');

  const imageMap = {
    'demo-listing-1': ['berkeley-house-1.svg', 'berkeley-house-2.svg'],
    'listing1': ['berkeley-hills-1.svg'],
    'listing2': ['palo-alto-studio-1.svg'],
    'listing3': ['davis-house-1.svg'],
    'demo-listing-2': ['mission-studio-1.svg', 'mission-studio-2.svg'],
    'demo-listing-3': ['palo-alto-tech-1.svg']
  };

  for (const [listingId, imageFiles] of Object.entries(imageMap)) {
    console.log(`\nProcessing listing: ${listingId}`);
    const uploadedUrls: string[] = [];

    for (const imageFile of imageFiles) {
      try {
        const imagePath = path.join(path.dirname(process.cwd()), 'public', 'images', imageFile);
        console.log(`    Path: ${imagePath}`);
        
        // Check if file exists
        try {
          await fs.access(imagePath);
          console.log(`    ✅ File exists: ${imageFile}`);
        } catch (error) {
          console.log(`  ⚠️  Image file not found: ${imageFile} (Error: ${error})`);
          continue;
        }

        // Read the SVG file
        const imageBuffer = await fs.readFile(imagePath);
        
        // Upload to Supabase with listing-specific naming
        const fileName = `listings/${listingId}-${imageFile}`;
        const publicUrl = await uploadImage(imageBuffer, fileName, 'image/svg+xml');
        
        if (publicUrl) {
          uploadedUrls.push(publicUrl);
          console.log(`  ✅ Uploaded: ${imageFile} -> ${publicUrl}`);
        } else {
          console.log(`  ❌ Failed to upload: ${imageFile}`);
        }
      } catch (error) {
        console.error(`  ❌ Error uploading ${imageFile}:`, error);
      }
    }

    // Update the listing in database with new Supabase URLs
    if (uploadedUrls.length > 0) {
      try {
        await storage.updateRoommateListingImages(listingId, uploadedUrls);
        console.log(`  📝 Updated database for ${listingId} with ${uploadedUrls.length} images`);
      } catch (error) {
        console.error(`  ❌ Failed to update database for ${listingId}:`, error);
      }
    }
  }

  console.log('\n✅ Demo image upload completed!');
}

// Run the upload script
uploadDemoImages().catch(console.error);