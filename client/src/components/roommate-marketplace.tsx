import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Filter, 
  Home, 
  Users, 
  Star,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  Bed
} from "lucide-react";
import RoommateListingCard from "./roommate-listing-card";
import { apiRequest } from "@/lib/queryClient";
import { insertRoommateListingSchema } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface RoommateMarketplaceProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RoommateMarketplace({ isOpen, onOpenChange }: RoommateMarketplaceProps) {
  const [activeTab, setActiveTab] = useState("browse");
  const [searchCity, setSearchCity] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch roommate listings
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['/api/roommate-listings'],
    enabled: isOpen,
  });

  // Fetch user's listings
  const { data: myListings = [] } = useQuery({
    queryKey: ['/api/roommate-listings/my'],
    enabled: isOpen && !!user,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-[#1a1a1a]">
                    Roommate Marketplace
                  </DialogTitle>
                  <p className="text-sm text-gray-600">Find your perfect roommate match</p>
                </div>
              </div>
              
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post Listing
              </Button>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mx-6 mt-4 bg-gray-100/50 backdrop-blur-sm">
                <TabsTrigger value="browse" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Listings
                </TabsTrigger>
                <TabsTrigger value="my-listings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Home className="w-4 h-4 mr-2" />
                  My Listings ({myListings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="flex-1 p-6 pt-4 overflow-hidden">
                <div className="flex flex-col h-full">
                  {/* Search and Filters */}
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by city..."
                        value={searchCity}
                        onChange={(e) => setSearchCity(e.target.value)}
                        className="bg-white/50 backdrop-blur-sm border-gray-200"
                      />
                    </div>
                    <Button variant="outline" className="bg-white/50 backdrop-blur-sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </div>

                  {/* Listings Grid */}
                  <div className="flex-1 overflow-auto">
                    {isLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredListings.map((listing: any) => (
                          <RoommateListingCard
                            key={listing.id}
                            listing={listing}
                            onContact={handleContact}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Users className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No listings found</h3>
                        <p className="text-gray-500 mb-4">
                          {searchCity ? `No roommate listings found in "${searchCity}"` : "No roommate listings available yet"}
                        </p>
                        <Button onClick={() => setShowCreateForm(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Post the first listing
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="my-listings" className="flex-1 p-6 pt-4 overflow-hidden">
                <div className="flex flex-col h-full">
                  {Array.isArray(myListings) && myListings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto">
                      {myListings.map((listing: any) => (
                        <RoommateListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Home className="w-16 h-16 text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No listings yet</h3>
                      <p className="text-gray-500 mb-4">Create your first roommate listing to get started</p>
                      <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Listing
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>

      {/* Create Listing Form Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#1a1a1a]">Create Roommate Listing</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Listing Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Beautiful room in downtown apartment" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address/Location</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, Downtown" {...field} />
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
                        placeholder="Describe the room, amenities, and what you're looking for in a roommate..."
                        className="h-24"
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
                        placeholder="WiFi, Parking, Laundry, Pool, Gym"
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

              <FormField
                control={form.control}
                name="preferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roommate Preferences (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Quiet, clean, non-smoker, student, professional..."
                        className="h-20"
                        {...field}
                      />
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
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}