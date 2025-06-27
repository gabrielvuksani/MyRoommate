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

  RefreshCw,
  MapPin,
} from "lucide-react";
import RoommateListingCard from "@/components/roommate-listing-card";
import { apiRequest } from "@/lib/queryClient";
import BackButton from "../components/back-button";
import { insertRoommateListingSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
    resolver: zodResolver(z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      rent: z.string().min(1, "Rent is required"),
      utilities: z.string().optional(),
      location: z.string().min(1, "Location is required"),
      city: z.string().min(1, "City is required"),
      university: z.string().optional(),
      availableFrom: z.date(),
      availableTo: z.date().optional(),
      roomType: z.enum(["private", "shared", "studio"]),
      housingType: z.enum(["apartment", "house", "condo", "townhouse", "dorm", "shared_house"]),
      genderPreference: z.enum(["male", "female", "any", "non_binary"]).optional(),
      studentYear: z.enum(["freshman", "sophomore", "junior", "senior", "graduate", "any"]).optional(),
      studyHabits: z.enum(["quiet", "moderate", "social", "flexible"]).optional(),
      socialPreferences: z.enum(["introverted", "extroverted", "balanced", "flexible"]).optional(),
      lifestylePreferences: z.array(z.string()).optional(),
      amenities: z.array(z.string()).optional(),
      contactInfo: z.string().optional(),
    })),
    defaultValues: {
      title: "",
      description: "",
      rent: "",
      utilities: "",
      location: "",
      city: "",
      university: "",
      availableFrom: new Date(),
      availableTo: new Date(),
      roomType: "private",
      housingType: "apartment",
      genderPreference: "any",
      studentYear: "any",
      studyHabits: "flexible",
      socialPreferences: "balanced",
      lifestylePreferences: [],
      amenities: [],
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

  const createDemoMutation = useMutation({
    mutationFn: () => apiRequest('/api/roommate-listings/demo', 'POST', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roommate-listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roommate-listings/my'] });
    },
  });

  const createDemoListing = () => {
    createDemoMutation.mutate();
  };

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
    <div className="min-h-screen page-transition" style={{ background: 'var(--background)' }}>
      {/* Floating Header */}
      <div className={`sticky top-0 z-40 transition-all duration-300 ${
        headerScrolled 
          ? 'shadow-sm' 
          : ''
      }`}
      style={{
        background: headerScrolled ? 'var(--surface-glass)' : 'transparent',
        backdropFilter: headerScrolled ? 'blur(20px)' : 'none',
        borderBottom: headerScrolled ? '1px solid var(--border)' : 'none'
      }}>
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BackButton to="/" />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-[22px]" style={{ color: 'var(--text-primary)' }}>Roommate Marketplace</h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="p-2 rounded-xl transition-all duration-200 hover:bg-opacity-10"
                style={{ 
                  background: 'transparent',
                  color: 'var(--text-secondary)'
                }}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowCreateForm(true)}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-lg transition-all duration-200"
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
              Browse ({Array.isArray(listings) ? listings.length : 0})
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
              My Listings ({Array.isArray(myListings) ? myListings.length : 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
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
              <Button 
                onClick={() => createDemoMutation.mutate()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={createDemoMutation.isPending}
              >
                {createDemoMutation.isPending ? "Creating..." : "Add Demo"}
              </Button>
            </div>

            {/* Create Listing Form */}
            {showCreateForm && (
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Create Roommate Listing</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateForm(false)}
                      className="transition-all duration-200"
                      style={{ color: 'var(--text-secondary)' }}
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
                              <Input placeholder="Room near UC Berkeley campus" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="university"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>University</FormLabel>
                            <FormControl>
                              <Input placeholder="UC Berkeley" {...field} />
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
                          name="utilities"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Utilities ($)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="100" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
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

                        <FormField
                          control={form.control}
                          name="availableTo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Available Until</FormLabel>
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
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input placeholder="1234 Telegraph Ave" {...field} />
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
                                <Input placeholder="Berkeley" {...field} />
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
                                  <SelectItem value="townhouse">Townhouse</SelectItem>
                                  <SelectItem value="dorm">Dorm</SelectItem>
                                  <SelectItem value="shared_house">Shared House</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="genderPreference"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender Preference</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Any" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="any">Any</SelectItem>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="non_binary">Non-binary</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="studentYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Student Year</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Any" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="any">Any</SelectItem>
                                  <SelectItem value="freshman">Freshman</SelectItem>
                                  <SelectItem value="sophomore">Sophomore</SelectItem>
                                  <SelectItem value="junior">Junior</SelectItem>
                                  <SelectItem value="senior">Senior</SelectItem>
                                  <SelectItem value="graduate">Graduate</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="studyHabits"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Study Habits</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Flexible" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="flexible">Flexible</SelectItem>
                                  <SelectItem value="quiet">Quiet</SelectItem>
                                  <SelectItem value="moderate">Moderate</SelectItem>
                                  <SelectItem value="social">Social</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="socialPreferences"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Social Preferences</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Balanced" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="balanced">Balanced</SelectItem>
                                  <SelectItem value="introverted">Introverted</SelectItem>
                                  <SelectItem value="extroverted">Extroverted</SelectItem>
                                  <SelectItem value="flexible">Flexible</SelectItem>
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
                                placeholder="Describe the room and what you're looking for in a roommate..."
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
                        <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createListingMutation.isPending}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
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