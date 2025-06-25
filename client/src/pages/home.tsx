import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [newHousehold, setNewHousehold] = useState({
    name: '',
    rentAmount: '',
    rentDueDay: '',
  });
  const [inviteCode, setInviteCode] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
    enabled: isAuthenticated,
  });

  const { data: chores = [] } = useQuery({
    queryKey: ["/api/chores"],
    enabled: !!household,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/messages"],
    enabled: !!household,
  });

  const { data: balance } = useQuery({
    queryKey: ["/api/balance"],
    enabled: !!household,
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ["/api/calendar"],
    enabled: !!household,
  });

  const createHouseholdMutation = useMutation({
    mutationFn: async (householdData: any) => {
      await apiRequest("POST", "/api/households", householdData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      setIsCreateOpen(false);
      setNewHousehold({ name: '', rentAmount: '', rentDueDay: '' });
      toast({
        title: "Success",
        description: "Household created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create household",
        variant: "destructive",
      });
    },
  });

  const joinHouseholdMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiRequest("POST", "/api/households/join", { inviteCode: code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/households/current"] });
      setIsJoinOpen(false);
      setInviteCode('');
      toast({
        title: "Success",
        description: "Joined household successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to join household. Check your invite code.",
        variant: "destructive",
      });
    },
  });

  const handleCreateHousehold = () => {
    if (!newHousehold.name.trim()) return;
    
    createHouseholdMutation.mutate({
      name: newHousehold.name,
      rentAmount: newHousehold.rentAmount ? parseFloat(newHousehold.rentAmount) : null,
      rentDueDay: newHousehold.rentDueDay ? parseInt(newHousehold.rentDueDay) : null,
    });
  };

  const handleJoinHousehold = () => {
    if (!inviteCode.trim()) return;
    joinHouseholdMutation.mutate(inviteCode.trim().toUpperCase());
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-gray">
        <div className="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-ios-gray">
        <div className="h-6 bg-white"></div>
        <div className="px-4 pt-4 pb-6 bg-white">
          <h1 className="text-ios-large-title font-bold text-black">Welcome to RoomieHub</h1>
          <p className="text-ios-subhead text-ios-gray-5 mt-1">Create or join a household to get started</p>
        </div>
        <div className="px-4 space-y-4">
          <Card className="card-shadow">
            <CardContent className="p-4">
              <h2 className="text-ios-headline font-semibold text-black mb-4">Create a New Household</h2>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-ios-blue text-white py-3 rounded-lg text-ios-body font-medium">
                    Create Household
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm mx-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Household</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Household name"
                      value={newHousehold.name}
                      onChange={(e) => setNewHousehold({ ...newHousehold, name: e.target.value })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Monthly rent (optional)"
                      value={newHousehold.rentAmount}
                      onChange={(e) => setNewHousehold({ ...newHousehold, rentAmount: e.target.value })}
                    />
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Rent due day (optional)"
                      value={newHousehold.rentDueDay}
                      onChange={(e) => setNewHousehold({ ...newHousehold, rentDueDay: e.target.value })}
                    />
                    <Button 
                      onClick={handleCreateHousehold}
                      disabled={!newHousehold.name.trim() || createHouseholdMutation.isPending}
                      className="w-full bg-ios-blue hover:bg-ios-blue/90"
                    >
                      {createHouseholdMutation.isPending ? "Creating..." : "Create Household"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          
          <Card className="card-shadow">
            <CardContent className="p-4">
              <h2 className="text-ios-headline font-semibold text-black mb-4">Join a Household</h2>
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full border border-ios-gray-3 rounded-lg px-4 py-3 text-ios-body uppercase"
                />
                <Button 
                  onClick={handleJoinHousehold}
                  disabled={!inviteCode.trim() || joinHouseholdMutation.isPending}
                  className="w-full bg-ios-green hover:bg-ios-green/90 text-white py-3 rounded-lg text-ios-body font-medium"
                >
                  {joinHouseholdMutation.isPending ? "Joining..." : "Join Household"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const activeChores = chores.filter((chore: any) => chore.status !== 'done');
  const recentMessages = messages.slice(-2);
  const upcomingEvents = calendarEvents.slice(0, 2);
  const netBalance = (balance?.totalOwed || 0) - (balance?.totalOwing || 0);

  const firstName = user.firstName || user.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-ios-gray pb-20">
      <div className="h-6 bg-white"></div>
      
      <div className="px-4 pt-4 pb-6 bg-white">
        <h1 className="text-ios-large-title font-bold text-black">
          Good morning, {firstName}
        </h1>
        <p className="text-ios-subhead text-ios-gray-5 mt-1">
          Here's what needs your attention
        </p>
      </div>
      
      <div className="px-4 space-y-3">
        {/* Active Chores Card */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-ios-headline font-semibold text-black">Active Chores</h2>
              <button 
                onClick={() => setLocation('/chores')}
                className="text-ios-footnote text-ios-blue font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-2">
              {activeChores.length === 0 ? (
                <p className="text-ios-body text-ios-gray-5">No active chores</p>
              ) : (
                activeChores.slice(0, 2).map((chore: any) => (
                  <div key={chore.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 border-2 border-ios-blue rounded-full"></div>
                      <div>
                        <p className="text-ios-body text-black">{chore.title}</p>
                        <p className="text-ios-footnote text-ios-gray-5">
                          {chore.assignedUser ? `${chore.assignedUser.firstName}'s turn` : 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    {chore.status === 'todo' && (
                      <span className="text-ios-caption text-ios-orange font-medium">Pending</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages Card */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-ios-headline font-semibold text-black">Recent Messages</h2>
              <button 
                onClick={() => setLocation('/messages')}
                className="text-ios-footnote text-ios-blue font-medium"
              >
                Open Chat
              </button>
            </div>
            <div className="space-y-3">
              {recentMessages.length === 0 ? (
                <p className="text-ios-body text-ios-gray-5">No recent messages</p>
              ) : (
                recentMessages.map((message: any) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-ios-blue rounded-full flex items-center justify-center">
                      <span className="text-white text-ios-footnote font-medium">
                        {message.user.firstName?.[0] || message.user.email?.[0] || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-ios-subhead text-black">{message.content}</p>
                      <p className="text-ios-footnote text-ios-gray-5 mt-1">
                        {message.user.firstName || message.user.email} • {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balance Summary Card */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-ios-headline font-semibold text-black">Your Balance</h2>
              <button 
                onClick={() => setLocation('/expenses')}
                className="text-ios-footnote text-ios-blue font-medium"
              >
                See Details
              </button>
            </div>
            <div className="text-center py-2">
              <p className={`text-ios-title-1 font-bold ${netBalance >= 0 ? 'text-ios-green' : 'text-ios-red'}`}>
                {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
              </p>
              <p className="text-ios-footnote text-ios-gray-5 mt-1">
                {netBalance >= 0 ? "You're owed money" : "You owe money"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Card */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-ios-headline font-semibold text-black">This Week</h2>
              <button 
                onClick={() => setLocation('/calendar')}
                className="text-ios-footnote text-ios-blue font-medium"
              >
                Calendar
              </button>
            </div>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-ios-body text-ios-gray-5">No upcoming events</p>
              ) : (
                upcomingEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center space-x-3">
                    <div 
                      className="w-2 h-8 rounded-full" 
                      style={{ backgroundColor: event.color }}
                    ></div>
                    <div className="flex-1">
                      <p className="text-ios-body text-black">{event.title}</p>
                      <p className="text-ios-footnote text-ios-gray-5">
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
