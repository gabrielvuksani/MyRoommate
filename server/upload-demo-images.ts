import { promises as fs } from 'fs';
import path from 'path';
import { uploadImage } from './supabase';
import { storage } from './storage';

// Upload all demo images to Supabase and update database
async function uploadDemoImages() {

  const imageMap = {
    'demo-listing-1': ['berkeley-house-1.svg', 'berkeley-house-2.svg'],
    'listing1': ['berkeley-hills-1.svg'],
    'listing2': ['palo-alto-studio-1.svg'],
    'listing3': ['davis-house-1.svg'],
    'demo-listing-2': ['mission-studio-1.svg', 'mission-studio-2.svg'],
    'demo-listing-3': ['palo-alto-tech-1.svg']
  };

  for (const [listingId, imageFiles] of Object.entries(imageMap)) {
    const uploadedUrls: string[] = [];

    for (const imageFile of imageFiles) {
      try {
        const imagePath = path.join(path.dirname(process.cwd()), 'public', 'images', imageFile);
        
        // Check if file exists
        try {
          await fs.access(imagePath);
        } catch (error) {
          continue;
        }

        // Read the SVG file
        const imageBuffer = await fs.readFile(imagePath);
        
        // Upload to Supabase with listing-specific naming
        const fileName = `listings/${listingId}-${imageFile}`;
        const publicUrl = await uploadImage(imageBuffer, fileName, 'image/svg+xml');
        
        if (publicUrl) {
          uploadedUrls.push(publicUrl);
        } else {
        }
      } catch (error) {
      }
    }

    // Update the listing in database with new Supabase URLs
    if (uploadedUrls.length > 0) {
      try {
        await storage.updateRoommateListingImages(listingId, uploadedUrls);
      } catch (error) {
      }
    }
  }

}

// Run the upload script
