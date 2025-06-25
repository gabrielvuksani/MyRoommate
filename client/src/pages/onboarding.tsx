import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { CheckCircle, Users, Home, ArrowRight, Sparkles, Calendar, DollarSign, MessageCircle, TrendingUp } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [householdData, setHouseholdData] = useState({
    name: '',
    inviteCode: '',
    action: 'create' // 'create' or 'join'
  });

  const createHouseholdMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("/api/households", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/household"] });
      setLocation("/home");
    },
    onError: (error) => {
      console.error("Error creating household:", error);
    },
  });

  const joinHouseholdMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await apiRequest("/api/households/join", {
        method: "POST",
        body: JSON.stringify({ inviteCode }),
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/household"] });
      setLocation("/home");
    },
    onError: (error) => {
      console.error("Error joining household:", error);
    },
  });

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleFinish = () => {
    if (householdData.action === 'create') {
      createHouseholdMutation.mutate(householdData.name);
    } else {
      joinHouseholdMutation.mutate(householdData.inviteCode);
    }
  };

  const canFinish = householdData.action === 'create' 
    ? householdData.name.trim().length > 0 
    : householdData.inviteCode.trim().length === 8;

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 page-transition">
      <div className="w-full max-w-md">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="glass-card p-8 text-center space-y-6 animate-scale-in">
            {/* Hero Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25">
              <Sparkles size={36} className="text-white" />
            </div>
            
            {/* Welcome Text */}
            <div className="space-y-3">
              <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Welcome to MyRoommate
              </h1>
              <p className="text-lg font-medium text-emerald-600">
                Hello, {firstName}! 👋
              </p>
              <p className="text-gray-600 leading-relaxed">
                Your all-in-one solution for seamless shared living. Let's set up your space for success.
              </p>
            </div>
            
            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4 py-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                <CheckCircle size={24} className="text-blue-600 mb-2" />
                <p className="text-sm font-medium text-blue-900">Smart Chores</p>
                <p className="text-xs text-blue-600">Track & assign tasks</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-2xl border border-emerald-100">
                <DollarSign size={24} className="text-emerald-600 mb-2" />
                <p className="text-sm font-medium text-emerald-900">Bill Splitting</p>
                <p className="text-xs text-emerald-600">Fair expense sharing</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-100">
                <Calendar size={24} className="text-purple-600 mb-2" />
                <p className="text-sm font-medium text-purple-900">Shared Calendar</p>
                <p className="text-xs text-purple-600">Sync your schedules</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-2xl border border-orange-100">
                <MessageCircle size={24} className="text-orange-600 mb-2" />
                <p className="text-sm font-medium text-orange-900">Group Chat</p>
                <p className="text-xs text-orange-600">Stay connected</p>
              </div>
            </div>

            <button 
              onClick={handleNext}
              className="btn-primary w-full py-4 text-lg font-medium group"
            >
              Get Started
              <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Step 2: Household Setup */}
        {step === 2 && (
          <div className="glass-card p-8 space-y-6 animate-slide-in-right">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-purple-500/25">
                <Users size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Set Up Your Household
              </h2>
              <p className="text-gray-600">Create a new household or join an existing one</p>
            </div>

            {/* Action Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setHouseholdData({ ...householdData, action: 'create' })}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  householdData.action === 'create'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Home size={24} className={`mx-auto mb-2 ${householdData.action === 'create' ? 'text-blue-600' : 'text-gray-500'}`} />
                <p className={`text-sm font-medium ${householdData.action === 'create' ? 'text-blue-900' : 'text-gray-700'}`}>
                  Create New
                </p>
                <p className={`text-xs ${householdData.action === 'create' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Start fresh
                </p>
              </button>
              <button
                onClick={() => setHouseholdData({ ...householdData, action: 'join' })}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  householdData.action === 'join'
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg shadow-emerald-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Users size={24} className={`mx-auto mb-2 ${householdData.action === 'join' ? 'text-emerald-600' : 'text-gray-500'}`} />
                <p className={`text-sm font-medium ${householdData.action === 'join' ? 'text-emerald-900' : 'text-gray-700'}`}>
                  Join Existing
                </p>
                <p className={`text-xs ${householdData.action === 'join' ? 'text-emerald-600' : 'text-gray-500'}`}>
                  Use invite code
                </p>
              </button>
            </div>

            {/* Form Fields */}
            {householdData.action === 'create' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Household Name
                  </label>
                  <input
                    placeholder="e.g. Maple Street House"
                    value={householdData.name}
                    onChange={(e) => setHouseholdData({ ...householdData, name: e.target.value })}
                    className="input-modern w-full"
                  />
                </div>
              </div>
            )}

            {householdData.action === 'join' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Code
                  </label>
                  <input
                    placeholder="Enter 8-character code"
                    value={householdData.inviteCode}
                    onChange={(e) => setHouseholdData({ ...householdData, inviteCode: e.target.value.toUpperCase() })}
                    className="input-modern w-full text-center tracking-wider font-mono"
                    maxLength={8}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={!canFinish || createHouseholdMutation.isPending || joinHouseholdMutation.isPending}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createHouseholdMutation.isPending || joinHouseholdMutation.isPending ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Setting up...</span>
                  </div>
                ) : (
                  <>
                    {householdData.action === 'create' ? 'Create Household' : 'Join Household'}
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}