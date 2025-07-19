import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Home, MapPin, Calendar, Star, Users, Building, DollarSign } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddListing() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  
  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    rent: "",
    utilities: "",
    location: "",
    city: "",
    university: "",
    availableFrom: new Date().toISOString().split('T')[0],
    availableTo: "",
    roomType: "private",
    housingType: "apartment",
    genderPreference: "any",
    studentYear: "any",
    studyHabits: "quiet",
    socialPreferences: "balanced",
    lifestylePreferences: [] as string[],
    amenities: [] as string[],
    contactInfo: "",
    featured: false
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle scroll for floating header
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const createListingMutation = useMutation({
    mutationFn: async (listingData: any) => {
      await apiRequest("POST", "/api/roommate-listings", {
        ...listingData,
        rent: parseInt(listingData.rent),
        utilities: listingData.utilities ? parseInt(listingData.utilities) : undefined,
        availableFrom: listingData.availableFrom,
        availableTo: listingData.availableTo || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roommate-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roommate-listings/my"] });
      setLocation("/roommates");
    },
    onError: (error) => {
      console.error("Failed to create listing:", error);
    },
  });

  const handleCreateListing = () => {
    if (!newListing.title || !newListing.rent || !newListing.location || !newListing.city) {
      return;
    }
    createListingMutation.mutate(newListing);
  };

  const amenityOptions = [
    "WiFi", "Laundry", "Kitchen", "Parking", "Gym", "Pool", "Balcony", 
    "Furnished", "Near Campus", "Quiet", "Pet Friendly", "Air Conditioning",
    "Heating", "Dishwasher", "Rooftop Access", "Study Areas"
  ];

  const lifestyleOptions = [
    "no_smoking", "pet_friendly", "clean", "quiet_hours", "social_events",
    "study_focused", "party_friendly", "vegetarian", "early_riser", "night_owl"
  ];

  const toggleAmenity = (amenity: string) => {
    setNewListing(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const toggleLifestyle = (lifestyle: string) => {
    setNewListing(prev => ({
      ...prev,
      lifestylePreferences: prev.lifestylePreferences.includes(lifestyle)
        ? prev.lifestylePreferences.filter(l => l !== lifestyle)
        : [...prev.lifestylePreferences, lifestyle]
    }));
  };

  return (
    <div className="min-h-screen bg-background page-transition">
      {/* Floating Header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          headerScrolled
            ? 'bg-header-bg backdrop-blur-[20px] border-b border-border shadow-sm'
            : 'bg-transparent'
        }`}
        style={{
          backdropFilter: headerScrolled ? 'blur(20px) saturate(1.8)' : 'none',
          WebkitBackdropFilter: headerScrolled ? 'blur(20px) saturate(1.8)' : 'none',
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/roommates")}
                className="w-10 h-10 rounded-xl transition-all duration-200 hover:scale-[1.05] btn-animated backdrop-blur-sm"
                style={{ 
                  background: 'var(--surface-glass)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  backdropFilter: 'blur(8px) saturate(1.2)'
                }}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Post Listing
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Find your perfect roommate
                </p>
              </div>
            </div>
            <Button
              onClick={handleCreateListing}
              disabled={!newListing.title || !newListing.rent || !newListing.location || !newListing.city || createListingMutation.isPending}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-medium transition-all duration-200 hover:scale-[1.02] shadow-lg disabled:opacity-50"
            >
              {createListingMutation.isPending ? "Creating..." : "Post Listing"}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto pt-32 px-6 space-y-6 pb-32">
        
        {/* Basic Information */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Basic Information
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Tell us about your space
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Listing Title *
                </label>
                <Input
                  placeholder="e.g., Spacious room near UC Berkeley"
                  value={newListing.title}
                  onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Description
                </label>
                <Textarea
                  placeholder="Describe your space, neighborhood, and what you're looking for in a roommate..."
                  value={newListing.description}
                  onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                  rows={4}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Monthly Rent *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="1200"
                      value={newListing.rent}
                      onChange={(e) => setNewListing({ ...newListing, rent: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Utilities (optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="100"
                      value={newListing.utilities}
                      onChange={(e) => setNewListing({ ...newListing, utilities: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Location Details
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Where is your place located?
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Street Address *
                </label>
                <Input
                  placeholder="123 Main Street, Apt 4B"
                  value={newListing.location}
                  onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    City *
                  </label>
                  <Input
                    placeholder="Berkeley"
                    value={newListing.city}
                    onChange={(e) => setNewListing({ ...newListing, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    University (optional)
                  </label>
                  <Input
                    placeholder="UC Berkeley"
                    value={newListing.university}
                    onChange={(e) => setNewListing({ ...newListing, university: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Property Details
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Tell us about the space
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Room Type
                </label>
                <Select value={newListing.roomType} onValueChange={(value) => setNewListing({ ...newListing, roomType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private Room</SelectItem>
                    <SelectItem value="shared">Shared Room</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Housing Type
                </label>
                <Select value={newListing.housingType} onValueChange={(value) => setNewListing({ ...newListing, housingType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="dorm">Dorm</SelectItem>
                    <SelectItem value="shared_house">Shared House</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Available From
                </label>
                <Input
                  type="date"
                  value={newListing.availableFrom}
                  onChange={(e) => setNewListing({ ...newListing, availableFrom: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Available To (optional)
                </label>
                <Input
                  type="date"
                  value={newListing.availableTo}
                  onChange={(e) => setNewListing({ ...newListing, availableTo: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roommate Preferences */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Roommate Preferences
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  What are you looking for?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Gender Preference
                </label>
                <Select value={newListing.genderPreference} onValueChange={(value) => setNewListing({ ...newListing, genderPreference: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non_binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Student Year
                </label>
                <Select value={newListing.studentYear} onValueChange={(value) => setNewListing({ ...newListing, studentYear: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="freshman">Freshman</SelectItem>
                    <SelectItem value="sophomore">Sophomore</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="graduate">Graduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Study Habits
                </label>
                <Select value={newListing.studyHabits} onValueChange={(value) => setNewListing({ ...newListing, studyHabits: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiet">Quiet</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Social Preferences
                </label>
                <Select value={newListing.socialPreferences} onValueChange={(value) => setNewListing({ ...newListing, socialPreferences: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="introverted">Introverted</SelectItem>
                    <SelectItem value="extroverted">Extroverted</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Amenities
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  What features does your place have?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {amenityOptions.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={newListing.amenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <label
                    htmlFor={amenity}
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {amenity}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle Preferences */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Lifestyle Preferences
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  What's your living style?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {lifestyleOptions.map((lifestyle) => (
                <div key={lifestyle} className="flex items-center space-x-2">
                  <Checkbox
                    id={lifestyle}
                    checked={newListing.lifestylePreferences.includes(lifestyle)}
                    onCheckedChange={() => toggleLifestyle(lifestyle)}
                  />
                  <label
                    htmlFor={lifestyle}
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {lifestyle.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Contact Information
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  How can people reach you?
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Contact Information (optional)
              </label>
              <Textarea
                placeholder="Email, phone, or preferred contact method..."
                value={newListing.contactInfo}
                onChange={(e) => setNewListing({ ...newListing, contactInfo: e.target.value })}
                rows={3}
                className="w-full"
              />
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="featured"
                checked={newListing.featured}
                onCheckedChange={(checked) => setNewListing({ ...newListing, featured: checked as boolean })}
              />
              <label
                htmlFor="featured"
                className="text-sm font-medium cursor-pointer"
                style={{ color: 'var(--text-primary)' }}
              >
                Feature this listing (appears at the top)
              </label>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}