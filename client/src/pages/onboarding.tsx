import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { useLocation } from "wouter";
import { CheckCircle, Users, Home, ArrowRight, User } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const queryClient = useQueryClient();
  
  const [userData, setUserData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  
  const [householdData, setHouseholdData] = useState({
    name: '',
    inviteCode: '',
    action: 'create' // 'create' or 'join'
  });

  const [errorMessage, setErrorMessage] = useState('');

  const createHouseholdMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/households", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      setLocation('/');
    },
  });

  const joinHouseholdMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      console.log("Frontend: Attempting to join household with code:", inviteCode);
      try {
        const result = await apiRequest("POST", "/api/households/join", { inviteCode });
        console.log("Frontend: Join household success:", result);
        return result;
      } catch (error) {
        console.error("Frontend: Join household error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Frontend: Join mutation success, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation('/');
    },
    onError: (error: any) => {
      console.error("Frontend: Join mutation error:", error);
      
      // Parse error message from different formats
      let errorText = "";
      if (error?.message) {
        // Extract from "404: {"message":"Invalid invite code"}" format
        const match = error.message.match(/\d+:\s*(.+)/);
        if (match) {
          try {
            const parsedError = JSON.parse(match[1]);
            errorText = parsedError.message || parsedError.error || error.message;
          } catch {
            errorText = match[1];
          }
        } else {
          errorText = error.message;
        }
      } else {
        errorText = "Unable to join household. Please try again.";
      }
      
      if (errorText.includes("Invalid invite code") || errorText.includes("Invalid")) {
        setErrorMessage("Invite code not found. Please check the code and try again.");
      } else if (errorText.includes("already a member")) {
        setErrorMessage("You're already a member of this household.");
      } else {
        setErrorMessage("Unable to join household. Please try again.");
      }
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", "/api/auth/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const handleNext = () => {
    if (step === 2) {
      // Update user name before proceeding to household setup
      updateUserMutation.mutate({
        firstName: userData.firstName,
        lastName: userData.lastName
      });
    }
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
    setErrorMessage(''); // Clear any previous errors
    if (householdData.action === 'create') {
      createHouseholdMutation.mutate({ name: householdData.name });
    } else {
      joinHouseholdMutation.mutate(householdData.inviteCode);
    }
  };

  const firstName = userData.firstName || user?.firstName || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen page-container flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        
        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card className="glass-card text-center page-enter">
            <CardContent className="p-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/25">
              <Home size={32} className="text-white" />
            </div>
            <h1 className="font-bold text-[#1a1a1a] text-[24px] leading-tight mb-3">
              Welcome to MyRoommate, {firstName}!
            </h1>
            <p className="text-gray-600 text-base leading-relaxed mb-8">
              Let's get you set up to start managing your shared living space effortlessly.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Track chores and tasks</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Split bills and expenses</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Share calendar events</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <span className="text-sm text-gray-700 font-medium">Chat with roommates</span>
              </div>
            </div>

            <Button 
              onClick={handleNext}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight size={16} className="ml-2" />
            </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Name Selection */}
        {step === 2 && (
          <Card className="glass-card page-enter">
            <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/25">
                <User size={32} className="text-white" />
              </div>
              <h1 className="font-bold text-[#1a1a1a] text-[24px] leading-tight mb-3">What should we call you?</h1>
              <p className="text-gray-600 text-base leading-relaxed mb-8">Choose how you'd like to appear to your roommates</p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-3">
                  First Name
                </label>
                <Input
                  placeholder="Enter your first name"
                  value={userData.firstName}
                  onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                  className="w-full h-12 rounded-xl border-0 bg-white/70 backdrop-blur-sm shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-3">
                  Last Name
                </label>
                <Input
                  placeholder="Enter your last name"
                  value={userData.lastName}
                  onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                  className="w-full h-12 rounded-xl border-0 bg-white/70 backdrop-blur-sm shadow-sm"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setStep(step - 1)}
                className="flex-1 h-12 bg-white/70 hover:bg-white/80 text-gray-700 border-0 rounded-2xl shadow-sm"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!userData.firstName.trim() || updateUserMutation.isPending}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02]"
              >
                {updateUserMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Household Setup */}
        {step === 3 && (
          <Card className="glass-card page-enter">
            <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-violet-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/25">
                <Users size={32} className="text-white" />
              </div>
              <h1 className="font-bold text-[#1a1a1a] text-[24px] leading-tight mb-3">Set Up Your Household</h1>
              <p className="text-gray-600 text-base leading-relaxed mb-8">Create a new household or join an existing one</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setErrorMessage(''); // Clear errors when switching modes
                    setHouseholdData({ ...householdData, action: 'create' });
                  }}
                  className={`h-20 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                    householdData.action === 'create' 
                      ? 'bg-gradient-to-br from-emerald-400 to-cyan-400 text-white shadow-lg shadow-emerald-500/25' 
                      : 'glass-card hover:scale-[1.02]'
                  }`}
                >
                  <Home size={20} />
                  <span className="text-sm font-medium">Create New</span>
                </button>
                <button
                  onClick={() => {
                    setErrorMessage(''); // Clear errors when switching modes
                    setHouseholdData({ ...householdData, action: 'join' });
                  }}
                  className={`h-20 rounded-2xl flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
                    householdData.action === 'join' 
                      ? 'bg-gradient-to-br from-emerald-400 to-cyan-400 text-white shadow-lg shadow-emerald-500/25' 
                      : 'glass-card hover:scale-[1.02]'
                  }`}
                >
                  <Users size={20} />
                  <span className="text-sm font-medium">Join Existing</span>
                </button>
              </div>

              {householdData.action === 'create' && (
                <div className="space-y-4 page-enter">
                  <div>
                    <label className="block text-sm font-semibold text-[#1a1a1a] mb-3">
                      Household Name
                    </label>
                    <Input
                      placeholder="e.g. Maple Street House"
                      value={householdData.name}
                      onChange={(e) => setHouseholdData({ ...householdData, name: e.target.value })}
                      className="w-full h-12 rounded-xl border-0 bg-white/70 backdrop-blur-sm shadow-sm"
                    />
                  </div>
                </div>
              )}

              {householdData.action === 'join' && (
                <div className="space-y-4 page-enter">
                  <div>
                    <label className="block text-sm font-semibold text-[#1a1a1a] mb-3">
                      Invite Code
                    </label>
                    <Input
                      placeholder="Enter 8-character code"
                      value={householdData.inviteCode}
                      onChange={(e) => {
                        setErrorMessage(''); // Clear errors when typing
                        setHouseholdData({ ...householdData, inviteCode: e.target.value.toUpperCase() });
                      }}
                      maxLength={8}
                      className="w-full h-12 rounded-xl border-0 bg-white/70 backdrop-blur-sm shadow-sm text-center tracking-wider font-mono text-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Ask your roommate for the household invite code
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setStep(step - 1)}
                className="flex-1 h-12 bg-white/70 hover:bg-white/80 text-gray-700 border-0 rounded-2xl shadow-sm"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={
                  (householdData.action === 'create' && !householdData.name.trim()) ||
                  (householdData.action === 'join' && householdData.inviteCode.length !== 8)
                }
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02]"
              >
                Continue
              </Button>
            </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <Card className="glass-card text-center page-enter">
            <CardContent className="p-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/25">
              <CheckCircle size={32} className="text-white" />
            </div>
            <h1 className="font-bold text-[#1a1a1a] text-[24px] leading-tight mb-3">Ready to Go!</h1>
            
            {householdData.action === 'create' ? (
              <div className="mb-8">
                <p className="text-gray-600 text-base leading-relaxed">
                  You're about to create "<strong className="text-[#1a1a1a]">{householdData.name}</strong>". 
                  You'll get an invite code to share with your roommates.
                </p>
              </div>
            ) : (
              <div className="mb-8">
                <p className="text-gray-600 text-base leading-relaxed">
                  You're about to join a household using code <strong className="text-[#1a1a1a] font-mono tracking-wider">{householdData.inviteCode}</strong>.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 glass-card bg-red-50/90 border-red-200/50 shadow-lg shadow-red-500/20 page-enter">
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800">Unable to Join Household</p>
                      <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={() => setStep(step - 1)}
                className="flex-1 h-12 bg-white/70 hover:bg-white/80 text-gray-700 border-0 rounded-2xl shadow-sm"
              >
                Back
              </Button>
              <Button
                onClick={handleFinish}
                disabled={createHouseholdMutation.isPending || joinHouseholdMutation.isPending}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02]"
              >
                {createHouseholdMutation.isPending || joinHouseholdMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Setting up...</span>
                  </div>
                ) : (
                  householdData.action === 'create' ? "Create Household" : "Join Household"
                )}
              </Button>
            </div>
            </CardContent>
          </Card>
        )}

        {/* Step indicator */}
        <div className="flex justify-center mt-8 space-x-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step 
                  ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 w-8 shadow-sm' 
                  : 'bg-white/60 w-2'
              }`}
            />
          ))}
        </div>
      </div>


    </div>
  );
}