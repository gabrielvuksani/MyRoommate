import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

import { 
  Plus, 
  Search, 
  Filter, 
  Home, 
  Users, 
  ArrowLeft,
  RefreshCw,
  MapPin,
} from "lucide-react";
import RoommateListingCard from "@/components/roommate-listing-card";
import { apiRequest } from "@/lib/queryClient";
import { insertRoommateListingSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";

export default function RoommateMarketplace() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchCity, setSearchCity] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch roommate listings
  const { data: listings = [], isLoading, refetch: refetchListings } = useQuery({
    queryKey: ['/api/roommate-listings'],
  });

  // Fetch user's listings
  const { data: myListings = [], refetch: refetchMyListings } = useQuery({
    queryKey: ['/api/roommate-listings/my'],
    enabled: !!user,
  });

  const form = useForm({
    resolver: zodResolver(insertRoommateListingSchema.extend({
      availableFrom: insertRoommateListingSchema.shape.availableFrom.transform(
        (val) => val instanceof Date ? val : new Date(val)
      ),
    })),
    defaultValues: {
      title: "",
      description: "",
      rent: "",
      location: "",
      city: "",
      availableFrom: new Date(),
      roomType: "private",
      housingType: "apartment",
      amenities: [],
      preferences: "",
      contactInfo: "",
      isActive: true,
      featured: false,
    },
  });

  const createListingMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/roommate-listings', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roommate-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roommate-listings/my'] });
      setShowCreateForm(false);
      setActiveTab("my-listings");
      form.reset();
    },
  });

  const onSubmit = (data: any) => {
    createListingMutation.mutate({
      ...data,
      rent: parseFloat(data.rent),
      amenities: data.amenities ? data.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) : [],
    });
  };

  const filteredListings = Array.isArray(listings) ? listings.filter((listing: any) => 
    !searchCity || listing.city.toLowerCase().includes(searchCity.toLowerCase())
  ) : [];

  const handleContact = (listing: any) => {
    if (listing.contactInfo) {
      window.open(`mailto:${listing.contactInfo}`, '_blank');
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchListings(),
      refetchMyListings(),
    ]);
    // Refresh the page after all other operations complete
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Floating Header */}
      <div className={`sticky top-0 z-40 transition-all duration-300 ${
        headerScrolled 
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-[#1a1a1a] text-[22px]">Roommate Marketplace</h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="p-2 bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg hover:bg-white/80 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
              >
                <RefreshCw className="w-4 h-4 text-gray-700" />
              </Button>
              <Button
                onClick={() => setShowCreateForm(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-xl backdrop-blur-sm text-white rounded-xl px-4 py-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-6 pt-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/40 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-1">
            <TabsTrigger value="browse" className="data-[state=active]:bg-white/80 data-[state=active]:shadow-xl data-[state=active]:backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-white/60">
              <Search className="w-4 h-4 mr-2" />
              Browse ({Array.isArray(listings) ? listings.length : 0})
            </TabsTrigger>
            <TabsTrigger value="my-listings" className="data-[state=active]:bg-white/80 data-[state=active]:shadow-xl data-[state=active]:backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-white/60">
              <Home className="w-4 h-4 mr-2" />
              My Listings ({Array.isArray(myListings) ? myListings.length : 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search by city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="pl-10 bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg focus:bg-white/80 focus:shadow-xl transition-all duration-200"
                />
              </div>
              <Button variant="outline" className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg hover:bg-white/80 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] p-3">
                <Filter className="w-4 h-4 text-gray-700" />
              </Button>
            </div>

            {/* Create Listing Form */}
            {showCreateForm && (
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#1a1a1a]">Create Roommate Listing</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                      className="w-8 h-8 p-0 bg-white/60 backdrop-blur-xl border border-white/20 rounded-lg shadow-lg hover:bg-white/80 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] text-gray-700"
                    >
                      ✕
                    </Button>
                  </div>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Listing Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Beautiful room in downtown apartment" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="rent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Rent ($)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="800" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="availableFrom"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Available From</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="Downtown" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="San Francisco" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="roomType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Room Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select room type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="private">Private Room</SelectItem>
                                  <SelectItem value="shared">Shared Room</SelectItem>
                                  <SelectItem value="studio">Studio</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="housingType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Housing Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select housing type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="apartment">Apartment</SelectItem>
                                  <SelectItem value="house">House</SelectItem>
                                  <SelectItem value="condo">Condo</SelectItem>
                                  <SelectItem value="dorm">Dorm</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe the room and what you're looking for..."
                                className="h-20"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="amenities"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amenities (comma-separated)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="WiFi, Parking, Laundry, Pool"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your.email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-3 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowCreateForm(false)}
                          className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg hover:bg-white/80 hover:shadow-xl transition-all duration-200 hover:scale-[1.02] text-gray-700"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createListingMutation.isPending}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-xl backdrop-blur-sm text-white rounded-xl px-6 py-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {createListingMutation.isPending ? "Creating..." : "Create Listing"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Listings Grid */}
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="glass-card animate-pulse">
                    <CardContent className="p-0">
                      <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : Array.isArray(filteredListings) && filteredListings.length > 0 ? (
              <div className="space-y-4">
                {filteredListings.map((listing: any) => (
                  <RoommateListingCard
                    key={listing.id}
                    listing={listing}
                    onContact={handleContact}
                  />
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchCity ? `No roommate listings found in "${searchCity}"` : "No roommate listings available yet"}
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Post the first listing
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-listings" className="space-y-6">
            {Array.isArray(myListings) && myListings.length > 0 ? (
              <div className="space-y-4">
                {myListings.map((listing: any) => (
                  <RoommateListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
                  <p className="text-gray-600 mb-4">Create your first roommate listing to get started</p>
                  <Button onClick={() => setShowCreateForm(true)}>
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