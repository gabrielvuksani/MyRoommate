import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Home, MapPin, Calendar, Users, GraduationCap, Heart, Camera, X } from "lucide-react";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
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
  const { user } = useAuth();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  
  const [newListing, setNewListing] = useState({
    title: "",
    description: "",
    rent: "",
    utilities: "",
    location: "",
    city: "",
    university: "",
    availableFrom: new Date().toISOString().split('T')[0], // Auto-select today's date
    availableTo: "",
    roomType: "private",
    housingType: "apartment", 
    genderPreference: "any",
    studentYear: "any",
    studyHabits: "flexible",
    socialPreferences: "balanced",
    lifestylePreferences: [] as string[],
    amenities: [] as string[],
    contactInfo: "",
    images: [] as string[],
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-populate contact info with user's email
  useEffect(() => {
    if (user?.email && !newListing.contactInfo) {
      setNewListing(prev => ({
        ...prev,
        contactInfo: user.email
      }));
    }
  }, [user?.email, newListing.contactInfo]);

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
      const data = {
        ...listingData,
        rent: parseInt(listingData.rent),
        utilities: listingData.utilities ? parseInt(listingData.utilities) : null,
        availableFrom: listingData.availableFrom,
        availableTo: listingData.availableTo || null,
      };
      
      await apiRequest("POST", "/api/roommate-listings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roommate-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roommate-listings/my"] });
      setLocation("/roommates");
    },
    onError: (error) => {

    },
  });

  const handleCreateListing = () => {
    if (!newListing.title || !newListing.rent || !newListing.location || !newListing.city || !newListing.availableFrom || !newListing.contactInfo || newListing.images.length === 0) {
      return;
    }
    
    createListingMutation.mutate(newListing);
  };

  const handleLifestyleChange = (lifestyle: string, checked: boolean) => {
    setNewListing(prev => ({
      ...prev,
      lifestylePreferences: checked 
        ? [...prev.lifestylePreferences, lifestyle]
        : prev.lifestylePreferences.filter(item => item !== lifestyle)
    }));
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setNewListing(prev => ({
      ...prev,
      amenities: checked 
        ? [...prev.amenities, amenity]
        : prev.amenities.filter(item => item !== amenity)
    }));
  };

  const lifestyleOptions = [
    { value: "no_smoking", label: "No Smoking" },
    { value: "pet_friendly", label: "Pet Friendly" },
    { value: "vegetarian", label: "Vegetarian/Vegan" },
    { value: "clean", label: "Very Clean" },
    { value: "quiet", label: "Quiet Environment" },
    { value: "social", label: "Social Friendly" }
  ];

  const amenityOptions = [
    { value: "WiFi", label: "WiFi" },
    { value: "Laundry", label: "Laundry" },
    { value: "Kitchen", label: "Full Kitchen" },
    { value: "Parking", label: "Parking" },
    { value: "Gym", label: "Gym/Fitness" },
    { value: "Pool", label: "Pool" },
    { value: "Near Campus", label: "Near Campus" },
    { value: "Public Transport", label: "Public Transport" },
    { value: "Furnished", label: "Furnished" },
    { value: "Balcony", label: "Balcony/Patio" }
  ];

  return (
    <div className="min-h-screen bg-background page-transition">
      {/* Floating Header */}
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setLocation("/roommates")}
                className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center transition-all hover:scale-105"
                style={{ color: 'var(--text-primary)' }}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="page-title">Create Listing</h1>
                <p className="page-subtitle">Post your roommate listing</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-32 px-6 space-y-6 pb-32">
        
        {/* Basic Information */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Basic Information</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tell us about your listing</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Listing Title *
                </label>
                <Input
                  placeholder="e.g., Cozy room near UC Berkeley campus"
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
                  placeholder="Describe your place, what you're looking for in a roommate..."
                  value={newListing.description}
                  onChange={(e) => setNewListing({ ...newListing, description: e.target.value })}
                  rows={4}
                  className="w-full"
                />
              </div>
              
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Photos *
                </label>
                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Add at least one photo to showcase your space
                </p>
                
                <div className="space-y-3">
                  {/* Upload Button */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setNewListing(prev => ({
                                ...prev,
                                images: [...prev.images, event.target?.result as string]
                              }));
                            }
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = ''; // Reset input
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                      style={{
                        borderColor: 'var(--border)',
                        background: 'var(--surface-secondary)'
                      }}
                    >
                      <div className="text-center">
                        <Camera className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--text-secondary)' }} />
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Click to add photos
                        </span>
                      </div>
                    </label>
                  </div>
                  
                  {/* Image Previews */}
                  {newListing.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {newListing.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setNewListing(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== index)
                              }));
                            }}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & University */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Location</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Where is your place located?</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Street Address *
                  </label>
                  <Input
                    placeholder="e.g., 123 Telegraph Ave"
                    value={newListing.location}
                    onChange={(e) => setNewListing({ ...newListing, location: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    City *
                  </label>
                  <Input
                    placeholder="e.g., Berkeley"
                    value={newListing.city}
                    onChange={(e) => setNewListing({ ...newListing, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    State/Province
                  </label>
                  <Input
                    placeholder="e.g., CA"
                    value={newListing.state || ""}
                    onChange={(e) => setNewListing({ ...newListing, state: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    ZIP/Postal Code
                  </label>
                  <Input
                    placeholder="e.g., 94704"
                    value={newListing.zipCode || ""}
                    onChange={(e) => setNewListing({ ...newListing, zipCode: e.target.value })}
                  />
                </div>


              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    University/School
                  </label>
                  <Input
                    placeholder="e.g., UC Berkeley, Stanford University"
                    value={newListing.university}
                    onChange={(e) => setNewListing({ ...newListing, university: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Distance to Campus
                  </label>
                  <Input
                    placeholder="e.g., 5 min walk, 2 miles"
                    value={newListing.distanceToCampus || ""}
                    onChange={(e) => setNewListing({ ...newListing, distanceToCampus: e.target.value })}
                  />
                </div>
              </div>


            </div>
          </CardContent>
        </Card>

        {/* Pricing & Dates */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Pricing & Availability</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Set your rent and availability</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Monthly Rent *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }}>$</div>
                  <Input
                    type="number"
                    placeholder="950"
                    className="pl-8"
                    value={newListing.rent}
                    onChange={(e) => setNewListing({ ...newListing, rent: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Monthly Utilities
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--text-secondary)' }}>$</div>
                  <Input
                    type="number"
                    placeholder="75"
                    className="pl-8"
                    value={newListing.utilities}
                    onChange={(e) => setNewListing({ ...newListing, utilities: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Available From *
                </label>
                <Input
                  type="date"
                  value={newListing.availableFrom}
                  onChange={(e) => setNewListing({ ...newListing, availableFrom: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Available Until
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

        {/* Housing Details */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Housing Details</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tell us about the space</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        {/* Student Preferences */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Roommate Preferences</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>What kind of roommate are you looking for?</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Study Habits
                </label>
                <Select value={newListing.studyHabits} onValueChange={(value) => setNewListing({ ...newListing, studyHabits: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    <SelectItem value="quiet">Quiet</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
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
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="introverted">Introverted</SelectItem>
                    <SelectItem value="extroverted">Extroverted</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle & Amenities */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Lifestyle & Amenities</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>What makes your place special?</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Lifestyle Preferences</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {lifestyleOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={newListing.lifestylePreferences.includes(option.value)}
                        onCheckedChange={(checked) => handleLifestyleChange(option.value, checked as boolean)}
                      />
                      <label
                        htmlFor={option.value}
                        className="text-sm cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenityOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.value}
                        checked={newListing.amenities.includes(option.value)}
                        onCheckedChange={(checked) => handleAmenityChange(option.value, checked as boolean)}
                      />
                      <label
                        htmlFor={option.value}
                        className="text-sm cursor-pointer"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Contact Information *
                </label>
                <Input
                  placeholder="Email or phone number for interested roommates"
                  value={newListing.contactInfo}
                  onChange={(e) => setNewListing({ ...newListing, contactInfo: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="sticky bottom-0 pt-4 pb-8" style={{ background: 'var(--background)' }}>
          {/* Validation Helper */}
          {(!newListing.title || !newListing.rent || !newListing.location || !newListing.city || !newListing.availableFrom || !newListing.contactInfo || newListing.images.length === 0) && (
            <p className="text-center text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              Please fill in all required fields (*)
            </p>
          )}
          <button
            onClick={handleCreateListing}
            disabled={createListingMutation.isPending || !newListing.title || !newListing.rent || !newListing.location || !newListing.city || !newListing.availableFrom || !newListing.contactInfo || newListing.images.length === 0}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold text-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {createListingMutation.isPending ? "Creating Listing..." : "Create Listing"}
          </button>
          
          
        </div>
      </div>
    </div>
  );
}