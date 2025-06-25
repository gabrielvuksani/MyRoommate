import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { useLocation } from "wouter";
import { CheckCircle, Users, Home, ArrowRight } from "lucide-react";

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
      return apiRequest("POST", "/api/households/join", { inviteCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      setLocation('/');
    },
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
    if (householdData.action === 'create') {
      createHouseholdMutation.mutate({ name: householdData.name });
    } else {
      joinHouseholdMutation.mutate(householdData.inviteCode);
    }
  };

  const firstName = userData.firstName || user?.firstName || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="glass-card p-8 rounded-3xl text-center page-enter">
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
          </div>
        )}

        {/* Step 2: Household Setup */}
        {step === 2 && (
          <div className="glass-card p-8 rounded-3xl page-enter">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-violet-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-purple-500/25">
                <Users size={24} className="text-white" />
              </div>
              <h2 className="font-bold text-[#1a1a1a] text-[20px] mb-2">Set Up Your Household</h2>
              <p className="text-gray-600">Create a new household or join an existing one</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setHouseholdData({ ...householdData, action: 'create' })}
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
                  onClick={() => setHouseholdData({ ...householdData, action: 'join' })}
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
                      onChange={(e) => setHouseholdData({ ...householdData, inviteCode: e.target.value.toUpperCase() })}
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

            <div className="flex space-x-3 mt-8">
              <Button
                onClick={() => setStep(step - 1)}
                className="flex-1 h-12 bg-white/70 hover:bg-white/80 text-gray-700 border-0 rounded-xl shadow-sm"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={
                  (householdData.action === 'create' && !householdData.name.trim()) ||
                  (householdData.action === 'join' && householdData.inviteCode.length !== 8)
                }
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="glass-card p-8 rounded-3xl text-center page-enter">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/25">
              <CheckCircle size={24} className="text-white" />
            </div>
            <h2 className="font-bold text-[#1a1a1a] text-[20px] mb-4">Ready to Go!</h2>
            
            {householdData.action === 'create' ? (
              <div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  You're about to create "<strong className="text-[#1a1a1a]">{householdData.name}</strong>". 
                  You'll get an invite code to share with your roommates.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  You're about to join a household using code <strong className="text-[#1a1a1a] font-mono tracking-wider">{householdData.inviteCode}</strong>.
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={() => setStep(step - 1)}
                className="flex-1 h-12 bg-white/70 hover:bg-white/80 text-gray-700 border-0 rounded-xl shadow-sm"
              >
                Back
              </Button>
              <Button
                onClick={handleFinish}
                disabled={createHouseholdMutation.isPending || joinHouseholdMutation.isPending}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50"
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
          </div>
        )}

        {/* Step indicator */}
        <div className="flex justify-center mt-8 space-x-3">
          {[1, 2, 3].map((i) => (
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