import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Users, Plus, Search, MapPin, Clock, Star, Heart } from "lucide-react";
import BackButton from "../components/back-button";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import RoommateListingCard from "@/components/roommate-listing-card";

export default function Roommates() {
  const [location, setLocation] = useLocation();
  const [showPostForm, setShowPostForm] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const queryClient = useQueryClient();

  // Auto scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["/api/roommate-listings", searchCity],
    queryFn: ({ queryKey }) => {
      const [, city] = queryKey;
      const params = city ? `?city=${encodeURIComponent(city)}` : '';
      return fetch(`/api/roommate-listings${params}`).then(res => res.json());
    }
  });

  const { data: myListings = [] } = useQuery({
    queryKey: ["/api/roommate-listings/my"],
  });

  const listingsArray = Array.isArray(listings) ? listings : [];
  const myListingsArray = Array.isArray(myListings) ? myListings : [];
  
  const featuredListings = listingsArray.filter((listing: any) => listing.featured);
  const regularListings = listingsArray.filter((listing: any) => !listing.featured);

  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    rent: "",
    location: "",
    city: "",
    availableFrom: "",
    roomType: "private",
    housingType: "apartment",
    bedrooms: "2",
    bathrooms: "1",
    amenities: [] as string[],
    utilitiesIncluded: [] as string[],
    preferences: "",
    petPolicy: "no-pets",
    smokingPolicy: "no-smoking",
    contactInfo: "",
    featured: false
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/roommate-listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Failed to create listing');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roommate-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roommate-listings/my"] });
      setNewListing({
        title: "",
        description: "",
        rent: "",
        location: "",
        city: "",
        availableFrom: "",
        roomType: "private",
        housingType: "apartment",
        bedrooms: "2",
        bathrooms: "1",
        amenities: [],
        utilitiesIncluded: [],
        preferences: "",
        petPolicy: "no-pets",
        smokingPolicy: "no-smoking",
        contactInfo: "",
        featured: false
      });
      setShowPostForm(false);
    },
  });

  const handleCreateListing = () => {
    if (!newListing.title || !newListing.rent || !newListing.location || !newListing.city) return;
    
    createListingMutation.mutate({
      ...newListing,
      rent: parseFloat(newListing.rent),
      availableFrom: newListing.availableFrom ? new Date(newListing.availableFrom) : new Date(),
      amenities: newListing.amenities
    });
  };

  return (
    <div className="page-container page-transition">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton to="/" className="bg-transparent" />
              <div>
                <h1 className="page-title">Find Your Roommates</h1>
                <p className="page-subtitle">Discover your perfect living situation</p>
              </div>
            </div>
            <button
              onClick={() => setShowPostForm(true)}
              className="w-12 h-12 bg-[var(--surface-secondary)] rounded-full flex items-center justify-center shadow-lg btn-animated transition-all hover:scale-[1.05]"
            >
              <Plus size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-48 px-6 space-y-6">
        {/* Search Bar */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 z-10" style={{ color: 'var(--text-secondary)' }} />
              <Input
                placeholder="Search by city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pl-12 input-modern"
                style={{
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  paddingLeft: '3rem'
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Post Listing Form */}
        {showPostForm && (
          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-color)'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Post a Listing
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPostForm(false)}
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </Button>
              </div>
              
              <div className="space-y-4">
                <Input
                  placeholder="Listing title"
                  value={newListing.title}
                  onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                  className="input-modern"
                  style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                
                <textarea
                  placeholder="Description"
                  value={newListing.description}
                  onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                  className="w-full p-3 rounded-xl resize-none h-24"
                  style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Monthly rent ($)"
                    type="number"
                    value={newListing.rent}
                    onChange={(e) => setNewListing({ ...newListing, rent: e.target.value })}
                    className="input-modern"
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  
                  <Input
                    placeholder="Available date"
                    type="date"
                    value={newListing.availableFrom}
                    onChange={(e) => setNewListing({ ...newListing, availableFrom: e.target.value })}
                    className="input-modern"
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Location (e.g., Downtown)"
                    value={newListing.location}
                    onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                    className="input-modern"
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  
                  <Input
                    placeholder="City (e.g., San Francisco)"
                    value={newListing.city}
                    onChange={(e) => setNewListing({ ...newListing, city: e.target.value })}
                    className="input-modern"
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                      Property Type
                    </label>
                    <Select
                      value={newListing.housingType}
                      onValueChange={(value) => setNewListing({ ...newListing, housingType: value })}
                    >
                      <SelectTrigger style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="basement">Basement</SelectItem>
                        <SelectItem value="studio">Studio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                      Bedrooms
                    </label>
                    <Select
                      value={newListing.bedrooms}
                      onValueChange={(value) => setNewListing({ ...newListing, bedrooms: value })}
                    >
                      <SelectTrigger style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 BR</SelectItem>
                        <SelectItem value="2">2 BR</SelectItem>
                        <SelectItem value="3">3 BR</SelectItem>
                        <SelectItem value="4">4 BR</SelectItem>
                        <SelectItem value="5">5+ BR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                      Bathrooms
                    </label>
                    <Select
                      value={newListing.bathrooms}
                      onValueChange={(value) => setNewListing({ ...newListing, bathrooms: value })}
                    >
                      <SelectTrigger style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Bath</SelectItem>
                        <SelectItem value="1.5">1.5 Bath</SelectItem>
                        <SelectItem value="2">2 Bath</SelectItem>
                        <SelectItem value="2.5">2.5 Bath</SelectItem>
                        <SelectItem value="3">3+ Bath</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                      Room Type
                    </label>
                    <Select
                      value={newListing.roomType}
                      onValueChange={(value) => setNewListing({ ...newListing, roomType: value })}
                    >
                      <SelectTrigger style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private Room</SelectItem>
                        <SelectItem value="shared">Shared Room</SelectItem>
                        <SelectItem value="entire">Entire Place</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                      Pet Policy
                    </label>
                    <Select
                      value={newListing.petPolicy}
                      onValueChange={(value) => setNewListing({ ...newListing, petPolicy: value })}
                    >
                      <SelectTrigger style={{
                        background: 'var(--surface-secondary)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                      }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-pets">No Pets</SelectItem>
                        <SelectItem value="cats">Cats OK</SelectItem>
                        <SelectItem value="dogs">Dogs OK</SelectItem>
                        <SelectItem value="cats-dogs">Cats & Dogs OK</SelectItem>
                        <SelectItem value="negotiable">Negotiable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                    Amenities
                  </label>
                  <Input
                    placeholder="e.g., WiFi, Parking, Gym, Pool, Laundry (comma-separated)"
                    value={newListing.amenities.join(', ')}
                    onChange={(e) => setNewListing({ 
                      ...newListing, 
                      amenities: e.target.value.split(',').map(a => a.trim()).filter(Boolean) 
                    })}
                    className="input-modern"
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                    Roommate Preferences
                  </label>
                  <textarea
                    placeholder="Describe your ideal roommate (age, lifestyle, interests, etc.)"
                    value={newListing.preferences}
                    onChange={(e) => setNewListing({ ...newListing, preferences: e.target.value })}
                    className="w-full p-3 rounded-xl resize-none h-20"
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                
                <Input
                  placeholder="Contact email"
                  type="email"
                  value={newListing.contactInfo}
                  onChange={(e) => setNewListing({ ...newListing, contactInfo: e.target.value })}
                  className="input-modern"
                  style={{
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
                
                <Button
                  onClick={handleCreateListing}
                  disabled={!newListing.title || !newListing.rent || !newListing.location || createListingMutation.isPending}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                >
                  {createListingMutation.isPending ? "Posting..." : "Post Listing"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Listings */}
        {myListingsArray.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              My Listings
            </h2>
            <div className="space-y-4">
              {myListingsArray.map((listing: any) => (
                <RoommateListingCard
                  key={listing.id}
                  listing={listing}
                  compact={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Featured Listings */}
        {featuredListings.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Featured Listings
              </h2>
            </div>
            <div className="space-y-4">
              {featuredListings.map((listing: any) => (
                <RoommateListingCard
                  key={listing.id}
                  listing={listing}
                  compact={false}
                  onContact={(listing) => {
                    if (listing.contactInfo) {
                      window.open(`mailto:${listing.contactInfo}`, '_blank');
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Listings */}
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {searchCity ? `Listings in ${searchCity}` : "All Listings"}
          </h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="glass-card" style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-color)'
                }}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 rounded w-3/4 mb-2" style={{ background: 'var(--bg-secondary)' }}></div>
                      <div className="h-3 rounded w-1/2 mb-4" style={{ background: 'var(--bg-secondary)' }}></div>
                      <div className="h-3 rounded w-full mb-2" style={{ background: 'var(--bg-secondary)' }}></div>
                      <div className="h-3 rounded w-2/3" style={{ background: 'var(--bg-secondary)' }}></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : regularListings.length > 0 ? (
            <div className="space-y-4">
              {regularListings.map((listing: any) => (
                <RoommateListingCard
                  key={listing.id}
                  listing={listing}
                  compact={false}
                  onContact={(listing) => {
                    if (listing.contactInfo) {
                      window.open(`mailto:${listing.contactInfo}`, '_blank');
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card" style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-color)'
            }}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {searchCity ? `No listings in ${searchCity}` : "No listings yet"}
                </h3>
                <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {searchCity ? "Try searching for a different city" : "Be the first to post a roommate listing"}
                </p>
                <Button
                  onClick={() => setShowPostForm(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Listing
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}