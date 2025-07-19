// Demo listing creation for showcase
export const createDemoListing = () => {
  // Create a sample image as base64 data URL for demo purposes
  const createSampleImage = () => {
    // This creates a simple SVG image as a placeholder
    const svgContent = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#bg)"/>
        <rect x="20" y="20" width="360" height="260" fill="rgba(255,255,255,0.1)" rx="12"/>
        <circle cx="200" cy="120" r="40" fill="rgba(255,255,255,0.2)"/>
        <rect x="160" y="140" width="80" height="6" fill="rgba(255,255,255,0.3)" rx="3"/>
        <rect x="170" y="155" width="60" height="4" fill="rgba(255,255,255,0.2)" rx="2"/>
        <text x="200" y="200" text-anchor="middle" font-family="system-ui" font-size="16" fill="white" opacity="0.8">Beautiful Modern Room</text>
        <text x="200" y="220" text-anchor="middle" font-family="system-ui" font-size="12" fill="white" opacity="0.6">Near UC Berkeley Campus</text>
      </svg>
    `;
    
    const base64 = btoa(svgContent);
    return `data:image/svg+xml;base64,${base64}`;
  };

  const demoListing = {
    title: "Beautiful Modern Room in Shared House",
    description: "Spacious and bright room available in a beautifully maintained 4-bedroom house just minutes from UC Berkeley campus. The house features a modern kitchen with stainless steel appliances, comfortable living spaces, fast WiFi, and a lovely backyard perfect for studying or relaxing. You'll be sharing with 3 other friendly students who value both academics and social life. The room comes partially furnished with a bed, desk, and ample closet space. This is perfect for someone looking for a balance of privacy and community in their living situation.",
    rent: 1450,
    utilities: 125,
    location: "2847 Telegraph Avenue",
    city: "Berkeley",
    state: "CA",
    zipCode: "94705",
    university: "UC Berkeley",
    distanceToCampus: "8 minute walk",
    availableFrom: new Date("2025-08-15"),
    availableTo: new Date("2026-05-31"),
    roomType: "private" as const,
    housingType: "house" as const,
    genderPreference: "female" as const,
    studentYear: "graduate" as const,
    studyHabits: "quiet" as const,
    socialPreferences: "balanced" as const,
    lifestylePreferences: ["clean", "no_smoking", "vegetarian", "quiet"],
    amenities: [
      "High-speed WiFi",
      "In-unit laundry", 
      "Modern kitchen",
      "Backyard/garden",
      "Desk and chair",
      "Natural lighting",
      "Shared living spaces",
      "Near public transit",
      "Bike storage",
      "Study-friendly environment"
    ],
    images: [createSampleImage()],
    contactInfo: "sarah.berkeley.housing@gmail.com",
    featured: true,
    isActive: true,
    verified: true
  };

  return demoListing;
};