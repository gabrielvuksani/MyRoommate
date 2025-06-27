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
  ArrowRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";

export default function ListingDetail() {
  const [match, params] = useRoute("/listings/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [headerScrolled, setHeaderScrolled] = useState(false);

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
    "In-unit laundry": Sparkles,
    "Gym": Dumbbell,
    "High-speed WiFi": Wifi,
    "Parking available": Car,
    "Rooftop deck": Home,
    "Central AC/Heating": Shield,
    "Dishwasher": Home,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-36 pb-20 px-6 max-w-3xl mx-auto">
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
      <div className="min-h-screen pt-36 pb-20 px-6 max-w-3xl mx-auto">
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
    <div className="min-h-screen pb-32">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BackButton to="/roommates" />
              <div>
                <h1 className="page-title">Listing Details</h1>
                <p className="page-subtitle">Room information</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-36 px-6 max-w-3xl mx-auto space-y-6 page-enter">
        {/* Image or Placeholder */}
        {typedListing.images && typedListing.images.length > 0 ? (
          <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
            <img 
              src={typedListing.images[0]} 
              alt={typedListing.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl flex items-center justify-center shadow-lg">
            <Home className="w-20 h-20 text-blue-400" />
          </div>
        )}

        {/* Main Details Card */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {typedListing.title}
              </h1>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-5 h-5" />
                  <span>{typedListing.location}, {typedListing.city}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                  {formatRent(typedListing.rent)}/mo
                </div>
              </div>
            </div>

            {/* Room Details */}
            <div className="flex gap-3 flex-wrap">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {typedListing.roomType.charAt(0).toUpperCase() + typedListing.roomType.slice(1)} Room
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {typedListing.housingType.charAt(0).toUpperCase() + typedListing.housingType.slice(1)}
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Calendar className="w-3 h-3 mr-1" />
                Available {format(new Date(typedListing.availableFrom), 'MMM d, yyyy')}
              </Badge>
            </div>

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

            {/* Preferences */}
            {typedListing.preferences && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Roommate Preferences
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                    {typedListing.preferences}
                  </p>
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
                      return (
                        <div 
                          key={index} 
                          className="flex items-center gap-2"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          <Icon className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                          <span className="text-sm">{amenity}</span>
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
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                    {getProfileInitials(typedListing.creator.firstName, typedListing.creator.lastName, typedListing.creator.email)}
                  </div>
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

        {/* Contact Button */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <Button 
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
              onClick={() => {
                // In a real app, this would open a chat or contact form
                alert(typedListing.contactInfo || "Contact the poster through the app");
              }}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contact Poster
            </Button>
            {user ? (
              <p className="text-xs text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
                You'll be connected through the app's messaging system
              </p>
            ) : (
              <p className="text-xs text-center mt-3" style={{ color: 'var(--text-secondary)' }}>
                Sign in to contact the poster
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}