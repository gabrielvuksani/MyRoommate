import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Search, MapPin, Clock, Star, Heart, Home, RefreshCw, Filter } from "lucide-react";
import BackButton from "../components/back-button";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import RoommateListingCard from "@/components/roommate-listing-card";

export default function Roommates() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("browse");
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
    mutationFn: (data: any) => apiRequest('/api/roommate-listings', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roommate-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roommate-listings/my'] });
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
      setActiveTab("my-listings");
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
              <Plus size={20} className="text-primary" />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-44 px-6 pb-24 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList 
            className="grid w-full grid-cols-2 p-1 rounded-2xl mb-6 relative overflow-hidden"
            style={{
              background: 'var(--surface-glass)',
              border: '1px solid var(--border)',
              backdropFilter: 'blur(20px) saturate(1.8)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Liquid glass indicator */}
            <div 
              className="absolute inset-y-1 rounded-xl transition-all duration-500 ease-out will-change-transform"
              style={{
                width: 'calc(50% - 4px)',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px) saturate(1.2)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
                transform: `translateX(${activeTab === 'my-listings' ? 'calc(100% + 4px)' : '4px'})`,
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            />
            <TabsTrigger 
              value="browse" 
              className="relative z-10 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center py-3 px-4"
              style={{
                color: activeTab === 'browse' ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: 'transparent'
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Browse ({listingsArray.length})
            </TabsTrigger>
            <TabsTrigger 
              value="my-listings" 
              className="relative z-10 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center py-3 px-4"
              style={{
                color: activeTab === 'my-listings' ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: 'transparent'
              }}
            >
              <Home className="w-4 h-4 mr-2" />
              My Listings ({myListingsArray.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MapPin 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                  style={{ color: 'var(--text-tertiary)' }}
                />
                <Input
                  placeholder="Search by city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="pl-10 backdrop-blur-sm transition-all duration-200"
                  style={{
                    background: 'var(--surface-glass)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <Button 
                variant="outline" 
                className="backdrop-blur-sm transition-all duration-200"
                style={{
                  background: 'var(--surface-glass)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            {/* Post Listing Form */}
            {showPostForm && (
              <Card className="glass-card" style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)'
              }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Create Roommate Listing
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPostForm(false)}
                      className="w-8 h-8 rounded-xl transition-all duration-200 hover:scale-[1.05] btn-animated backdrop-blur-sm"
                      style={{ 
                        background: 'var(--surface-glass)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        backdropFilter: 'blur(8px) saturate(1.2)'
                      }}
                    >
                      ✕
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
                        placeholder="Available from"
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
                        placeholder="Location"
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
                        placeholder="City"
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
                      border: '1px solid var(--border)'
                    }}>
                      <CardContent className="p-6">
                        <div className="animate-pulse">
                          <div className="h-4 rounded w-3/4 mb-2" style={{ background: 'var(--surface-secondary)' }}></div>
                          <div className="h-3 rounded w-1/2 mb-4" style={{ background: 'var(--surface-secondary)' }}></div>
                          <div className="h-3 rounded w-full mb-2" style={{ background: 'var(--surface-secondary)' }}></div>
                          <div className="h-3 rounded w-2/3" style={{ background: 'var(--surface-secondary)' }}></div>
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
                  border: '1px solid var(--border)'
                }}>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      No listings found
                    </h3>
                    <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                      {searchCity ? `No listings found in ${searchCity}` : "Be the first to post a listing!"}
                    </p>
                    <Button
                      onClick={() => setShowPostForm(true)}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Post Listing
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-listings" className="space-y-6">
            {myListingsArray.length > 0 ? (
              <div className="space-y-4">
                {myListingsArray.map((listing: any) => (
                  <RoommateListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No listings yet</h3>
                  <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Create your first roommate listing to get started</p>
                  <Button onClick={() => setShowPostForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Listing
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}