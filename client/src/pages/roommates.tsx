import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, MapPin, Clock, Star, Heart, Home, RefreshCw, Filter } from "lucide-react";
import BackButton from "../components/back-button";
import { useLocation } from "wouter";

import RoommateListingCard from "@/components/roommate-listing-card";

export default function Roommates() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchCity, setSearchCity] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);


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
  
  // Sort all listings: featured first, then by creation date
  const sortedListings = [...listingsArray].sort((a: any, b: any) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });



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
              onClick={() => setLocation("/add-listing")}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-[1.05]"
            >
              <Plus size={20} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-44 px-6 pb-24 space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList 
            className="grid w-full grid-cols-2 backdrop-blur-sm"
            style={{ 
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border)'
            }}
          >
            <TabsTrigger 
              value="browse" 
              className="transition-all duration-200"
              style={{
                color: activeTab === 'browse' ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: activeTab === 'browse' ? 'var(--surface)' : 'transparent',
                boxShadow: activeTab === 'browse' ? 'var(--shadow-soft)' : 'none'
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Browse ({listingsArray.length})
            </TabsTrigger>
            <TabsTrigger 
              value="my-listings" 
              className="transition-all duration-200"
              style={{
                color: activeTab === 'my-listings' ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: activeTab === 'my-listings' ? 'var(--surface)' : 'transparent',
                boxShadow: activeTab === 'my-listings' ? 'var(--shadow-soft)' : 'none'
              }}
            >
              <Home className="w-4 h-4 mr-2" />
              My Listings ({myListingsArray.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* All Listings (Featured at top) */}
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
              ) : sortedListings.length > 0 ? (
                <div className="space-y-4">
                  {sortedListings.map((listing: any) => (
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
                    <button
                      onClick={() => setLocation("/add-listing")}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium transition-all hover:scale-[1.02] hover:shadow-lg"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Post Listing
                    </button>
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
                  <button
                    onClick={() => setLocation("/add-listing")}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium transition-all hover:scale-[1.02] hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Listing
                  </button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}