import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { useLocation } from "wouter";
import { CheckCircle, Users, Home, ArrowRight, User, Search } from "lucide-react";
import BackButton from "@/components/back-button";
import { getUserFlags, shouldShowOnboardingStep, getNextOnboardingStep, getPreviousOnboardingStep } from "@/lib/userUtils";

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
    firstName: (user as any)?.firstName || '',
    lastName: (user as any)?.lastName || '',
  });
  
  const [householdData, setHouseholdData] = useState({
    name: '',
    inviteCode: '',
    action: 'create' as 'create' | 'join' | 'browse'
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
    const nextStep = getNextOnboardingStep(step, isNewUser, isExistingUser);
    
    if (step === 2 && isNewUser) {
      // New users: Update name before proceeding to household setup
      updateUserMutation.mutate({
        firstName: userData.firstName,
        lastName: userData.lastName
      });
    }
    
    if (nextStep !== step) {
      setStep(nextStep);
    }
  };

  const handleBack = () => {
    const prevStep = getPreviousOnboardingStep(step, isExistingUser);
    if (prevStep !== step) {
      setStep(prevStep);
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

  const firstName = userData.firstName || (user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'there';
  
  // Get centralized user flags for consistent differentiation
  const userFlags = getUserFlags(user, null, true); // null household since we're in onboarding
  const { isNewUser, isExistingUser } = userFlags;

  return (
    <div className="min-h-screen page-container page-transition flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        
        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card className="glass-card text-center page-enter" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>
            <CardContent className="p-8 flex flex-col">
            {isExistingUser && (
              <div className="flex justify-start mb-4">
                <BackButton to="/" />
              </div>
            )}
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/25">
              <Home size={32} className="text-white" />
            </div>
            <h1 className="font-bold text-[22px] leading-tight mb-3" style={{ color: 'var(--text-primary)' }}>
              Welcome to MyRoommate, {firstName}!
            </h1>
            <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
              Let's get you set up to start managing your shared living space effortlessly.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Track chores and tasks</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Split bills and expenses</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Share calendar events</span>
              </div>
              <div className="flex items-center space-x-3 text-left">
                <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={14} className="text-white" />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Chat with roommates</span>
              </div>
            </div>

            <Button 
              onClick={handleNext}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white btn-animated font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
            >
              Get Started
              <ArrowRight size={16} className="ml-2" />
            </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Name Selection - Only for new users */}
        {step === 2 && shouldShowOnboardingStep(2, isNewUser) && (
          <Card className="glass-card page-enter" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>
            <CardContent className="p-8 flex flex-col">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/25">
                <User size={32} className="text-white" />
              </div>
              <h1 className="font-bold text-[22px] leading-tight mb-3" style={{ color: 'var(--text-primary)' }}>What should we call you?</h1>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>Choose how you'd like to appear to your roommates</p>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  First Name
                </label>
                <Input
                  placeholder="Enter your first name"
                  value={userData.firstName}
                  onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                  className="w-full h-12 rounded-xl border-0 backdrop-blur-sm shadow-sm"
                  style={{ 
                    background: 'var(--surface-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  Last Name
                </label>
                <Input
                  placeholder="Enter your last name"
                  value={userData.lastName}
                  onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                  className="w-full h-12 rounded-xl border-0 backdrop-blur-sm shadow-sm"
                  style={{ 
                    background: 'var(--surface-secondary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              {isNewUser && (
                <Button
                  onClick={handleBack}
                  className="flex-1 h-12 border-0 rounded-2xl shadow-sm transition-all btn-animated hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    color: 'var(--text-primary)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)'
                  }}
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!userData.firstName.trim() || updateUserMutation.isPending}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold btn-animated rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02]"
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
          <Card className="glass-card page-enter" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>
            <CardContent className="p-8 flex flex-col">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-violet-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/25">
                <Users size={32} className="text-white" />
              </div>
              <h1 className="font-bold text-[22px] leading-tight mb-3" style={{ color: 'var(--text-primary)' }}>Choose Your Path</h1>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>What would you like to do next?</p>
            </div>

            <div className="space-y-6 mb-8">
              <button
                onClick={() => {
                  setErrorMessage('');
                  setHouseholdData({ ...householdData, action: 'create' });
                }}
                className={`w-full rounded-2xl flex items-center space-x-4 transition-all duration-200 ${
                  householdData.action === 'create' 
                    ? 'p-8 bg-gradient-to-br from-emerald-400 to-cyan-400 text-white shadow-lg shadow-emerald-500/25' 
                    : 'py-8 pr-8 pl-12 glass-card hover:scale-[1.02]'
                }`}
                style={householdData.action !== 'create' ? {
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-primary)'
                } : {}}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Home size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Create Household</h3>
                  <p className="text-sm opacity-80">Start managing shared living</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setErrorMessage('');
                  setHouseholdData({ ...householdData, action: 'join' });
                }}
                className={`w-full rounded-2xl flex items-center space-x-4 transition-all duration-200 ${
                  householdData.action === 'join' 
                    ? 'p-8 bg-gradient-to-br from-emerald-400 to-cyan-400 text-white shadow-lg shadow-emerald-500/25' 
                    : 'py-8 pr-8 pl-12 glass-card hover:scale-[1.02]'
                }`}
                style={householdData.action !== 'join' ? {
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-primary)'
                } : {}}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Users size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Join Household</h3>
                  <p className="text-sm opacity-80">Connect with existing roommates</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setErrorMessage('');
                  setHouseholdData({ ...householdData, action: 'browse' });
                }}
                className={`w-full rounded-2xl flex items-center space-x-4 transition-all duration-200 ${
                  householdData.action === 'browse' 
                    ? 'p-8 bg-gradient-to-br from-purple-400 to-violet-500 text-white shadow-lg shadow-purple-500/25' 
                    : 'py-8 pr-8 pl-12 glass-card hover:scale-[1.02]'
                }`}
                style={householdData.action !== 'browse' ? {
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-primary)'
                } : {}}
              >
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Search size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Find Roommates</h3>
                  <p className="text-sm opacity-80">Browse available listings</p>
                </div>
              </button>
            </div>

            {householdData.action === 'create' && (
              <div className="space-y-6 page-enter pt-4">
                <div>
                  <label className="block text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Household Name
                  </label>
                  <Input
                    placeholder="e.g. Maple Street House"
                    value={householdData.name}
                    onChange={(e) => {
                      setErrorMessage('');
                      setHouseholdData({ ...householdData, name: e.target.value });
                    }}
                    className="w-full h-14 rounded-xl border-0 backdrop-blur-sm shadow-sm"
                    style={{ 
                      background: 'var(--surface-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>
            )}

            {householdData.action === 'join' && (
              <div className="space-y-6 page-enter pt-4">
                <div>
                  <label className="block text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                    Invite Code
                  </label>
                  <Input
                    placeholder="Enter 8-character code"
                    value={householdData.inviteCode}
                    onChange={(e) => {
                      setErrorMessage('');
                      setHouseholdData({ ...householdData, inviteCode: e.target.value.toUpperCase() });
                    }}
                    maxLength={8}
                    className="w-full h-14 rounded-xl border-0 backdrop-blur-sm shadow-sm text-center tracking-wider font-mono text-lg"
                    style={{ 
                      background: 'var(--surface-secondary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <p className="text-xs mt-3 text-center" style={{ color: 'var(--text-secondary)' }}>
                    Ask your roommate for the household invite code
                  </p>
                </div>
              </div>
            )}

            {householdData.action === 'browse' && (
              <div className="text-center page-enter py-8 pt-4">
                <div className="space-y-4">
                  <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                    Perfect! Your profile is ready.
                  </p>
                  <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    You can browse roommate listings and create your own when ready.
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="glass-card border-red-200 bg-red-50/50 page-enter">
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

            <div className="flex space-x-3 pt-[10px] pb-[10px]">
              <Button
                onClick={handleBack}
                className="flex-1 h-12 border-0 rounded-2xl btn-animated shadow-sm transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)'
                }}
              >
                Back
              </Button>
              {householdData.action === 'browse' ? (
                <Button
                  onClick={() => setLocation("/roommates")}
                  className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold rounded-2xl btn-animated shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-[1.02]"
                >
                  Browse Roommates
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={
                    (householdData.action === 'create' && !householdData.name.trim()) ||
                    (householdData.action === 'join' && householdData.inviteCode.length !== 8)
                  }
                  className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-2xl btn-animated shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50 hover:scale-[1.02]"
                >
                  Continue
                </Button>
              )}
            </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <Card className="glass-card text-center page-enter" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>
            <CardContent className="p-8 flex flex-col">
              <div className="flex flex-col justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/25">
                  <CheckCircle size={32} className="text-white" />
                </div>
                <h1 className="font-bold text-[22px] leading-tight mb-3" style={{ color: 'var(--text-primary)' }}>Ready to Go!</h1>
                
                {householdData.action === 'create' ? (
                  <div className="mb-8">
                    <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      You're about to create "<strong style={{ color: 'var(--text-primary)' }}>{householdData.name}</strong>". 
                      You'll get an invite code to share with your roommates.
                    </p>
                  </div>
                ) : householdData.action === 'join' ? (
                  <div className="mb-8">
                    <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      You're about to join a household using code <strong style={{ color: 'var(--text-primary)' }} className="font-mono tracking-wider">{householdData.inviteCode}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="mb-8">
                    <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Your profile is ready! You can now browse roommate listings and connect with potential roommates.
                    </p>
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-6 glass-card bg-red-50/90 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50 shadow-lg shadow-red-500/20 page-enter">
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-800 dark:text-red-200">Unable to Join Household</p>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">{errorMessage}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-8">
                <Button
                  onClick={handleBack}
                  className="flex-1 h-12 border-0 rounded-2xl shadow-sm transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    color: 'var(--text-primary)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)'
                  }}
                >
                  Back
                </Button>
                {householdData.action === 'browse' ? (
                  <Button
                    onClick={() => setLocation("/roommates")}
                    className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/25 transition-all duration-200 hover:scale-[1.02]"
                  >
                    Browse Roommates
                  </Button>
                ) : (
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
                    )
                  }
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step indicator */}
        <div className="flex justify-center mt-8 space-x-3">
          {(() => {
            // Get visible steps based on user type
            const visibleSteps = isNewUser ? [1, 2, 3, 4] : [1, 3, 4];
            
            // Map current step to indicator position
            const currentIndicatorPosition = visibleSteps.indexOf(step) + 1;
            
            return visibleSteps.map((stepNum, index) => (
              <div
                key={stepNum}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index + 1 === currentIndicatorPosition
                    ? "w-8 bg-gradient-to-r from-emerald-500 to-cyan-500"
                    : "w-2 bg-gray-400 dark:bg-gray-500"
                }`}
              />
            ));
          })()}
        </div>
      </div>
    </div>
  );
}