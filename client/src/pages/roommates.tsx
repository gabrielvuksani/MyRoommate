import { useState, useEffect, useMemo, useCallback } from "react";
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
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: myListings = [] } = useQuery({
    queryKey: ["/api/roommate-listings/my"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Memoize arrays and sorting for performance
  const listingsArray = useMemo(() => Array.isArray(listings) ? listings : [], [listings]);
  const myListingsArray = useMemo(() => Array.isArray(myListings) ? myListings : [], [myListings]);
  
  // Sort all listings: featured first, then by creation date
  const sortedListings = useMemo(() => 
    [...listingsArray].sort((a: any, b: any) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }), [listingsArray]
  );

  // Memoize navigation callback
  const handleAddListing = useCallback(() => {
    setLocation("/add-listing");
  }, [setLocation]);

  // Memoize contact handler
  const handleContact = useCallback((listing: any) => {
    if (listing.contactInfo) {
      if (listing.contactInfo.includes('@')) {
        window.open(`mailto:${listing.contactInfo}`, '_blank');
      } else {
        // Copy phone number to clipboard
        navigator.clipboard.writeText(listing.contactInfo);
      }
    }
  }, []);



  return (
    <div className="page-container page-transition">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-5 flex-1 min-w-0">
              <BackButton to="/" className="bg-transparent flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="page-title">Find Your Roommates</h1>
                <p className="page-subtitle">Discover your perfect living situation</p>
              </div>
            </div>
            <div className="flex-shrink-0 ml-4">
              <button
                onClick={() => setLocation("/add-listing")}
                className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg btn-animated hover:scale-105 transition-transform duration-200"
              >
                <Plus size={20} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="content-with-header-roommates px-6 pb-24 space-y-6">
        {/* Tab Bar */}
        <div className="flex justify-center">
          <div
            className="flex space-x-1 p-1 rounded-2xl border"
            style={{ 
              background: "var(--surface-secondary)",
              borderColor: "var(--border)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
            }}
          >
            <button
              onClick={() => setActiveTab("browse")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center border"
              style={{
                background:
                  activeTab === "browse"
                    ? "var(--primary)"
                    : "transparent",
                color:
                  activeTab === "browse"
                    ? "white"
                    : "var(--text-secondary)",
                borderColor:
                  activeTab === "browse"
                    ? "transparent"
                    : "rgba(0, 0, 0, 0.06)",
              }}
            >
              <Search className="w-4 h-4 mr-2" />
              Browse ({listingsArray.length})
            </button>
            
            <button
              onClick={() => setActiveTab("my-listings")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center border"
              style={{
                background:
                  activeTab === "my-listings"
                    ? "var(--primary)"
                    : "transparent",
                color:
                  activeTab === "my-listings"
                    ? "white"
                    : "var(--text-secondary)",
                borderColor:
                  activeTab === "my-listings"
                    ? "transparent"
                    : "rgba(0, 0, 0, 0.06)",
              }}
            >
              <Home className="w-4 h-4 mr-2" />
              My Listings ({myListingsArray.length})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

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
                      onContact={handleContact}
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
                      onClick={handleAddListing}
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
                    onClick={handleAddListing}
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