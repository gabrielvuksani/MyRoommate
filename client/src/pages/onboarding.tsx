import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CheckCircle, Users, Home, ArrowRight } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
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
      toast({
        title: "Success!",
        description: "Your household has been created",
      });
      setLocation('/');
    },
  });

  const joinHouseholdMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      return apiRequest("POST", "/api/households/join", { inviteCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      toast({
        title: "Welcome!",
        description: "You've joined the household",
      });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card className="animate-scale-in">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to MyRoommate, {firstName}!
              </h1>
              <p className="text-gray-600 mb-8">
                Let's get you set up to start managing your shared living space effortlessly.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3 text-left">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Track chores and tasks</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Split bills and expenses</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Share calendar events</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Chat with roommates</span>
                </div>
              </div>

              <Button 
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                Get Started
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Household Setup */}
        {step === 2 && (
          <Card className="animate-slide-in-right">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Set Up Your Household</h2>
                <p className="text-gray-600">Create a new household or join an existing one</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={householdData.action === 'create' ? 'default' : 'outline'}
                    onClick={() => setHouseholdData({ ...householdData, action: 'create' })}
                    className="h-auto py-4 flex-col space-y-2"
                  >
                    <Home size={20} />
                    <span className="text-sm">Create New</span>
                  </Button>
                  <Button
                    variant={householdData.action === 'join' ? 'default' : 'outline'}
                    onClick={() => setHouseholdData({ ...householdData, action: 'join' })}
                    className="h-auto py-4 flex-col space-y-2"
                  >
                    <Users size={20} />
                    <span className="text-sm">Join Existing</span>
                  </Button>
                </div>

                {householdData.action === 'create' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Household Name
                      </label>
                      <Input
                        placeholder="e.g. Maple Street House"
                        value={householdData.name}
                        onChange={(e) => setHouseholdData({ ...householdData, name: e.target.value })}
                        className="w-full"
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
                      <Input
                        placeholder="Enter 8-character code"
                        value={householdData.inviteCode}
                        onChange={(e) => setHouseholdData({ ...householdData, inviteCode: e.target.value.toUpperCase() })}
                        maxLength={8}
                        className="w-full text-center tracking-wider font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Ask your roommate for the household invite code
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={
                    (householdData.action === 'create' && !householdData.name.trim()) ||
                    (householdData.action === 'join' && householdData.inviteCode.length !== 8)
                  }
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <Card className="animate-slide-in-right">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Go!</h2>
              
              {householdData.action === 'create' ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    You're about to create "<strong>{householdData.name}</strong>". 
                    You'll get an invite code to share with your roommates.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-6">
                    You're about to join a household using code <strong>{householdData.inviteCode}</strong>.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={createHouseholdMutation.isPending || joinHouseholdMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {createHouseholdMutation.isPending || joinHouseholdMutation.isPending ? (
                    "Setting up..."
                  ) : (
                    householdData.action === 'create' ? "Create Household" : "Join Household"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step indicator */}
        <div className="flex justify-center mt-6 space-x-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-blue-500 w-6' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}