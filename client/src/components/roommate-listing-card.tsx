import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Home, User, DollarSign, Star } from "lucide-react";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";
import { format } from "date-fns";

interface RoommateListingCardProps {
  listing: any;
  onContact?: (listing: any) => void;
  compact?: boolean;
}

export default function RoommateListingCard({ listing, onContact, compact = false }: RoommateListingCardProps) {
  const formatRent = (rent: string) => {
    return `$${parseFloat(rent).toLocaleString()}`;
  };

  return (
    <Card className={`glass-card overflow-hidden transition-all duration-200 hover:shadow-lg ${compact ? 'h-auto' : 'h-full'}`}>
      <CardContent className="p-0">
        {/* Featured Badge */}
        {listing.featured && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 shadow-lg">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}

        {/* Image Placeholder */}
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
          {listing.images && listing.images.length > 0 ? (
            <img 
              src={listing.images[0]} 
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Home className="w-12 h-12 text-blue-400" />
            </div>
          )}
          
          {/* Rent Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-white/90 text-gray-900 border-0 shadow-lg backdrop-blur-sm">
              <DollarSign className="w-3 h-3 mr-1" />
              {formatRent(listing.rent)}/mo
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Title and Location */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[#1a1a1a] text-lg line-clamp-1">
              {listing.title}
            </h3>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{listing.location}, {listing.city}</span>
            </div>
          </div>

          {/* Type Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {listing.roomType}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {listing.housingType}
            </Badge>
          </div>

          {/* Description */}
          {!compact && listing.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {listing.description}
            </p>
          )}

          {/* Available Date */}
          <div className="flex items-center text-gray-600 text-sm">
            <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
            <span>Available {format(new Date(listing.availableFrom), 'MMM d, yyyy')}</span>
          </div>

          {/* Creator Info and Contact */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
                {getProfileInitials(listing.creator?.firstName, listing.creator?.lastName, listing.creator?.email)}
              </div>
              <span className="text-sm text-gray-600">
                {formatDisplayName(listing.creator?.firstName, listing.creator?.lastName, "Host")}
              </span>
            </div>
            
            {onContact && (
              <Button 
                size="sm" 
                onClick={() => onContact(listing)}
                className="text-xs px-3 py-1 h-auto"
              >
                Contact
              </Button>
            )}
          </div>

          {/* Amenities */}
          {!compact && listing.amenities && listing.amenities.length > 0 && (
            <div className="pt-2">
              <div className="flex flex-wrap gap-1">
                {listing.amenities.slice(0, 3).map((amenity: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs text-gray-600">
                    {amenity}
                  </Badge>
                ))}
                {listing.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs text-gray-600">
                    +{listing.amenities.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}