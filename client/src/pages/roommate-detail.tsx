import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/back-button";
import {
  MapPin,
  DollarSign,
  Calendar,
  User,
  Home,
  Wifi,
  Car,
  Users,
  Star,
  MessageCircle,
  Phone,
  Mail,
  Shield,
  Clock,
} from "lucide-react";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";

export default function RoommateDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ["/api/roommate-listings", id],
    queryFn: () => fetch(`/api/roommate-listings/${id}`).then(res => res.json()),
  });

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-gray">
        <div className="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Listing not found</h2>
          <Button onClick={() => setLocation("/roommates")}>
            Back to Listings
          </Button>
        </div>
      </div>
    );
  }

  const creator = listing.creator;
  const amenities = listing.amenities || [];

  return (
    <div className="page-container page-transition">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center space-x-4">
            <BackButton to="/roommates" />
            <div>
              <h1 className="page-title">Roommate Listing</h1>
              <p className="page-subtitle">{listing.city}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-32 px-6 space-y-6">
        {/* Hero Section */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {listing.title}
                </h2>
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
                    <MapPin size={16} />
                    <span className="text-sm">{listing.city}</span>
                  </div>
                  <div className="flex items-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
                    <DollarSign size={16} />
                    <span className="text-sm">${listing.rent}/month</span>
                  </div>
                  <div className="flex items-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
                    <Calendar size={16} />
                    <span className="text-sm">Available {new Date(listing.availableFrom).toLocaleDateString()}</span>
                  </div>
                </div>
                {listing.featured && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    <Star size={12} className="mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
            </div>

            <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-primary)' }}>
              <p>{listing.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Room Details */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Room Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Home size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Room Type</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{listing.roomType}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <DollarSign size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Monthly Rent</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>${listing.rent}</p>
                </div>
              </div>
              {listing.deposit && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Deposit</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>${listing.deposit}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Clock size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Available From</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(listing.availableFrom).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        {amenities.length > 0 && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {amenities.map((amenity: string, index: number) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
              Posted by
            </h3>
            <div className="flex items-center space-x-4 mb-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)'
                }}
              >
                {getProfileInitials(creator?.firstName, creator?.lastName, creator?.email)}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {formatDisplayName(creator?.firstName, creator?.lastName, creator?.email)}
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Posted {new Date(listing.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => window.open(`mailto:${creator?.email}?subject=Interest in your roommate listing: ${listing.title}`, '_blank')}
              >
                <Mail size={20} className="mr-2" />
                Send Message
              </Button>
              
              {listing.contactInfo && (
                <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Contact Information
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {listing.contactInfo}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}