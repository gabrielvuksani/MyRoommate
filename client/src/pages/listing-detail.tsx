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

  if (!listing) {
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
    <div className="min-h-screen pb-20">
      {/* Floating Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        headerScrolled
          ? "floating-header-blur border-b"
          : "floating-header"
      }`}>
        <div className="flex items-center h-20 px-6">
          <BackButton to="/roommates" />
          <h1 className="flex-1 text-center font-semibold text-[22px]" style={{ color: 'var(--text-primary)' }}>
            Listing Details
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="pt-36 px-6 max-w-3xl mx-auto space-y-6 page-enter">
        {/* Image or Placeholder */}
        {listing.images && listing.images.length > 0 ? (
          <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
            <img 
              src={listing.images[0]} 
              alt={listing.title}
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
                {listing.title}
              </h1>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-5 h-5" />
                  <span>{listing.location}, {listing.city}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                  {formatRent(listing.rent)}/mo
                </div>
              </div>
            </div>

            {/* Room Details */}
            <div className="flex gap-3 flex-wrap">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {listing.roomType.charAt(0).toUpperCase() + listing.roomType.slice(1)} Room
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {listing.housingType.charAt(0).toUpperCase() + listing.housingType.slice(1)}
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Calendar className="w-3 h-3 mr-1" />
                Available {format(new Date(listing.availableFrom), 'MMM d, yyyy')}
              </Badge>
            </div>

            {/* Description */}
            {listing.description && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    About this Place
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                    {listing.description}
                  </p>
                </div>
              </>
            )}

            {/* Preferences */}
            {listing.preferences && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Roommate Preferences
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                    {listing.preferences}
                  </p>
                </div>
              </>
            )}

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Amenities
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {listing.amenities.map((amenity: string, index: number) => {
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
        {listing.creator && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                    {getProfileInitials(listing.creator.firstName, listing.creator.lastName, listing.creator.email)}
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Posted by {formatDisplayName(listing.creator.firstName, listing.creator.lastName, "User")}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {format(new Date(listing.createdAt), 'MMM d, yyyy')}
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
                alert(listing.contactInfo || "Contact the poster through the app");
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