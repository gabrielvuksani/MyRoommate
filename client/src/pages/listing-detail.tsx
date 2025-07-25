import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BackButton from "@/components/back-button";
import { 
  Home, 
  MapPin, 
  DollarSign, 
  Calendar, 
  MessageCircle, 
  User,
  Wifi,
  Car,
  Dumbbell,
  Sparkles,
  Cat,
  Shield,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Waves,
  Bus,
  Sofa,
  Trees,
  Utensils,
  WashingMachine,
  Bike,
  Train,
  Users,
  BookOpen,
  Volume2,
  Music,
  Library,
  Cigarette,
  Dog,
  PartyPopper,
  Moon,
  Sun,
  Coffee
} from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";
import { QuickAvatar } from "@/components/ProfileAvatar";

export default function ListingDetail() {
  const [match, params] = useRoute("/listings/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: listing, isLoading } = useQuery({
    queryKey: [`/api/roommate-listings/${params?.id}`],
    enabled: !!params?.id,
  });

  // Type guard to ensure listing has required properties
  const typedListing = listing as any;

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const amenityIcons: { [key: string]: any } = {
    // From add-listing.tsx options
    "WiFi": Wifi,
    "Laundry": WashingMachine,
    "Kitchen": Utensils,
    "Full Kitchen": Utensils,
    "Parking": Car,
    "Gym": Dumbbell,
    "Gym/Fitness": Dumbbell,
    "Pool": Waves,
    "Near Campus": GraduationCap,
    "Public Transport": Bus,
    "Furnished": Sofa,
    "Balcony": Trees,
    "Balcony/Patio": Trees,
    
    // From demo listing
    "High-speed WiFi": Wifi,
    "In-unit laundry": WashingMachine,
    "Modern kitchen": Utensils,
    "Backyard/garden": Trees,
    "Desk and chair": Sofa,
    "Natural lighting": Sparkles,
    "Shared living spaces": Home,
    "Near public transit": Bus,
    "Bike storage": Bike,
    "Study-friendly environment": GraduationCap,
    "Parking available": Car,
    "Rooftop deck": Home,
    "Central AC/Heating": Shield,
    "Dishwasher": Utensils,
    
    // Lowercase versions (from API)
    "wifi": Wifi,
    "laundry": WashingMachine,
    "kitchen": Utensils,
    "parking": Car,
    "gym": Dumbbell,
    "pool": Waves,
    "near campus": GraduationCap,
    "public transport": Bus,
    "furnished": Sofa,
    "balcony": Trees,
    "study_space": GraduationCap
  };

  if (isLoading) {
    return (
      <div className="min-h-screen content-with-header pb-20 px-6 max-w-3xl mx-auto">
        <div className="space-y-4">
          <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (!typedListing) {
    return (
      <div className="min-h-screen content-with-header pb-20 px-6 max-w-3xl mx-auto">
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <Home className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Listing Not Found
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              This listing may have been removed or is no longer available.
            </p>
            <Button 
              onClick={() => navigate("/roommates")}
              className="btn-animated"
            >
              Browse Listings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatRent = (rent: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rent);
  };

  return (
    <div className="min-h-screen pb-32 page-transition">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BackButton to="/roommates" />
              <div>
                <h1 className="page-title">Room Details</h1>
                <p className="page-subtitle">More Information on the Listing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-with-header-compact px-6 max-w-3xl mx-auto space-y-6 page-enter">
        {/* Image Gallery with Featured Badge */}
        <div className="relative">
          {typedListing.images && typedListing.images.length > 0 ? (
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg relative">
              <img 
                src={typedListing.images[currentImageIndex]} 
                alt={`${typedListing.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              
              {/* Navigation Arrows - Only show if multiple images */}
              {typedListing.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === 0 ? typedListing.images.length - 1 : prev - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev === typedListing.images.length - 1 ? 0 : prev + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
                    {typedListing.images.map((_: any, index: number) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex 
                            ? 'bg-white' 
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl flex items-center justify-center shadow-lg">
              <Home className="w-20 h-20 text-blue-400" />
            </div>
          )}
          
          {/* Featured Badge */}
          {typedListing.featured && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 shadow-lg px-3 py-1">
                <Star className="w-4 h-4 mr-1" />
                Featured
              </Badge>
            </div>
          )}
        </div>

        {/* Main Details Card */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                {typedListing.title}
              </h1>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              <span className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                {typedListing.location}, {typedListing.city}
                {typedListing.state && `, ${typedListing.state}`}
                {typedListing.zipCode && ` ${typedListing.zipCode}`}
              </span>
            </div>

            {/* Price Card */}
            <div className="p-4 rounded-2xl" style={{ background: 'var(--surface-secondary)' }}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                <span className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>
                  Monthly Rent
                </span>
              </div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatRent(typedListing.rent)}
                <span className="text-lg font-normal" style={{ color: 'var(--text-secondary)' }}>/month</span>
              </div>
              {typedListing.utilities && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  + ${typedListing.utilities} utilities
                </p>
              )}
            </div>

            {/* Room Details */}
            <div className="flex gap-3 flex-wrap">
              <Badge className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0">
                {typedListing.roomType.charAt(0).toUpperCase() + typedListing.roomType.slice(1)} Room
              </Badge>
              <Badge className="text-sm px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0">
                {typedListing.housingType.charAt(0).toUpperCase() + typedListing.housingType.slice(1)}
              </Badge>
              <Badge className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0">
                <Calendar className="w-3 h-3 mr-1" />
                Available from {format(new Date(typedListing.availableFrom), 'MMM d, yyyy')}
              </Badge>
            </div>

            {/* Location Details */}
            {(typedListing.university || typedListing.distanceToCampus) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Location Details
                  </h3>
                  <div className="space-y-2">
                    {typedListing.university && (
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Near {typedListing.university}
                        </span>
                      </div>
                    )}
                    {typedListing.distanceToCampus && (
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {typedListing.distanceToCampus} to campus
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Description */}
            {typedListing.description && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    About this Place
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                    {typedListing.description}
                  </p>
                </div>
              </>
            )}

            {/* Lifestyle Preferences */}
            {(typedListing.genderPreference || typedListing.studentYear || typedListing.studyHabits || typedListing.socialPreferences || (typedListing.lifestylePreferences && typedListing.lifestylePreferences.length > 0)) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Lifestyle Preferences
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {typedListing.genderPreference && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {typedListing.genderPreference.charAt(0).toUpperCase() + typedListing.genderPreference.slice(1)} roommates
                        </span>
                      </div>
                    )}
                    {typedListing.studentYear && typedListing.studentYear !== 'any' && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {typedListing.studentYear.charAt(0).toUpperCase() + typedListing.studentYear.slice(1)} students
                        </span>
                      </div>
                    )}
                    {typedListing.studyHabits && (
                      <div className="flex items-center gap-2">
                        {typedListing.studyHabits === 'quiet' && <Library className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
                        {typedListing.studyHabits === 'moderate' && <BookOpen className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
                        {typedListing.studyHabits === 'flexible' && <Coffee className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {typedListing.studyHabits.charAt(0).toUpperCase() + typedListing.studyHabits.slice(1)} study habits
                        </span>
                      </div>
                    )}
                    {typedListing.socialPreferences && (
                      <div className="flex items-center gap-2">
                        {typedListing.socialPreferences === 'social' && <PartyPopper className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
                        {typedListing.socialPreferences === 'balanced' && <Users className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
                        {typedListing.socialPreferences === 'quiet' && <Moon className="w-4 h-4" style={{ color: 'var(--primary)' }} />}
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {typedListing.socialPreferences.charAt(0).toUpperCase() + typedListing.socialPreferences.slice(1)} social style
                        </span>
                      </div>
                    )}
                  </div>
                  {typedListing.lifestylePreferences && typedListing.lifestylePreferences.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {typedListing.lifestylePreferences.map((pref: string, index: number) => {
                        let icon = Shield;
                        if (pref === 'night-owl' || pref === 'night_owl') icon = Moon;
                        else if (pref === 'early-bird' || pref === 'early_bird') icon = Sun;
                        else if (pref === 'pet-friendly' || pref === 'pet_friendly') icon = Cat;
                        else if (pref === 'non-smoker' || pref === 'non_smoker') icon = Cigarette;
                        else if (pref === 'vegan' || pref === 'vegetarian') icon = Utensils;
                        else if (pref === 'music-lover' || pref === 'music_lover') icon = Music;
                        else if (pref === 'fitness-enthusiast' || pref === 'fitness_enthusiast') icon = Dumbbell;
                        else if (pref === 'quiet-hours' || pref === 'quiet_hours') icon = Volume2;
                        else if (pref === 'clean-freak' || pref === 'clean_freak' || pref === 'cleanliness') icon = Sparkles;
                        else if (pref === 'social-butterfly' || pref === 'social_butterfly') icon = Users;
                        else if (pref === 'study-focused' || pref === 'study_focused') icon = BookOpen;
                        else if (pref === 'party-friendly' || pref === 'party_friendly') icon = PartyPopper;
                        else if (pref === 'dog-friendly' || pref === 'dog_friendly') icon = Dog;
                        
                        const IconComponent = icon;
                        const displayName = pref.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {displayName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Amenities */}
            {typedListing.amenities && typedListing.amenities.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Amenities
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {typedListing.amenities.map((amenity: string, index: number) => {
                      const Icon = amenityIcons[amenity] || Home;
                      // Format amenity name for display
                      const displayName = amenity
                        .replace(/_/g, ' ')
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                      
                      return (
                        <div 
                          key={index} 
                          className="flex items-center gap-2"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                          <span className="text-sm">{displayName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Creator Card */}
        {typedListing.creator && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <QuickAvatar 
                    user={typedListing.creator} 
                    size="lg" 
                    gradientType="blue"
                  />
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Posted by {formatDisplayName(typedListing.creator.firstName, typedListing.creator.lastName, "User")}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {format(new Date(typedListing.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Contact Information
              </h3>
              {typedListing.contactInfo && (
                <div className="p-4 rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {typedListing.contactInfo}
                  </p>
                </div>
              )}
              <Button 
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
                onClick={() => {
                  // In a real app, this would open a chat or contact form
                  if (typedListing.contactInfo) {
                    if (typedListing.contactInfo.includes('@')) {
                      window.open(`mailto:${typedListing.contactInfo}`, '_blank');
                    } else {
                      navigator.clipboard.writeText(typedListing.contactInfo);
                      alert('Contact info copied to clipboard!');
                    }
                  }
                }}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Poster
              </Button>
              {user ? (
                <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                  Click to email or copy contact information
                </p>
              ) : (
                <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                  Sign in to contact the poster
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}