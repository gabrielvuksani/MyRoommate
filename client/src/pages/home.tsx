import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckSquare, DollarSign, Calendar, MessageSquare, Plus } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="page-container">
        <div className="floating-header">
          <div className="px-6 py-6">
            <h1 className="header-content text-3xl font-black tracking-tight">RoomieFlow</h1>
            <p className="text-subhead text-secondary mt-1">Create or join a household to get started</p>
          </div>
        </div>
        <div className="page-content space-y-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <h2 className="text-headline font-semibold text-primary mb-4">Create New Household</h2>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary text-white py-3 rounded-2xl text-body font-semibold">
                    Create Household
                  </Button>
                </DialogTrigger>
                <DialogContent className="modal-content">
                  <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="text-title-2 font-bold text-primary">Create New Household</DialogTitle>
                  </DialogHeader>
                  <div className="px-6 pb-6 space-y-4">
                    <Input
                      placeholder="Household name"
                      value={newHousehold.name}
                      onChange={(e) => setNewHousehold({ ...newHousehold, name: e.target.value })}
                      className="w-full p-4 bg-surface border border-border-subtle rounded-2xl"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Monthly rent (optional)"
                      value={newHousehold.rentAmount}
                      onChange={(e) => setNewHousehold({ ...newHousehold, rentAmount: e.target.value })}
                      className="w-full p-4 bg-surface border border-border-subtle rounded-2xl"
                    />
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Rent due day (optional)"
                      value={newHousehold.rentDueDay}
                      onChange={(e) => setNewHousehold({ ...newHousehold, rentDueDay: e.target.value })}
                      className="w-full p-4 bg-surface border border-border-subtle rounded-2xl"
                    />
                    <Button 
                      onClick={handleCreateHousehold}
                      disabled={!newHousehold.name.trim() || createHouseholdMutation.isPending}
                      className="w-full bg-primary text-white py-3 rounded-2xl font-semibold"
                    >
                      {createHouseholdMutation.isPending ? "Creating..." : "Create Household"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-6">
              <h2 className="text-headline font-semibold text-primary mb-4">Join Household</h2>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full p-4 bg-surface border border-border-subtle rounded-2xl uppercase"
                />
                <Button 
                  onClick={handleJoinHousehold}
                  disabled={!inviteCode.trim() || joinHouseholdMutation.isPending}
                  className="w-full bg-accent text-white py-3 rounded-2xl font-semibold"
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
    <div className="page-container">
      {/* visionOS Header */}
      <div className="floating-header">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="header-content text-3xl font-black tracking-tight">RoomieFlow</h1>
              <p className="text-subhead text-secondary mt-1">
                Hey {firstName}! 👋
              </p>
            </div>
            
            <button 
              onClick={() => setLocation('/settings')}
              className="w-10 h-10 bg-surface border border-border-subtle rounded-full flex items-center justify-center text-primary font-semibold text-sm hover:bg-surface-secondary transition-all"
            >
              {firstName[0]?.toUpperCase() || '?'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="page-content space-y-8">
        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setLocation('/chores')}
            className="group bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-6 text-white shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <CheckSquare size={28} className="mb-3" />
            <div className="text-left">
              <p className="text-headline font-bold">Chores</p>
              <p className="text-caption opacity-90">Manage tasks</p>
            </div>
          </button>
          
          <button
            onClick={() => setLocation('/expenses')}
            className="group bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl p-6 text-white shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <DollarSign size={28} className="mb-3" />
            <div className="text-left">
              <p className="text-headline font-bold">Expenses</p>
              <p className="text-caption opacity-90">Split bills</p>
            </div>
          </button>
          
          <button
            onClick={() => setLocation('/calendar')}
            className="group bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 text-white shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Calendar size={28} className="mb-3" />
            <div className="text-left">
              <p className="text-headline font-bold">Calendar</p>
              <p className="text-caption opacity-90">Plan events</p>
            </div>
          </button>
          
          <button
            onClick={() => setLocation('/messages')}
            className="group bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-6 text-white shadow-soft transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <MessageSquare size={28} className="mb-3" />
            <div className="text-left">
              <p className="text-headline font-bold">Chat</p>
              <p className="text-caption opacity-90">Group messages</p>
            </div>
          </button>
        </div>

        {/* Smart Balance Card */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-title-2 font-bold text-primary">Money Balance</h2>
                <p className="text-subhead text-secondary">Your financial status</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center">
                <DollarSign className="text-white" size={24} />
              </div>
            </div>
            {balance ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-2xl">
                  <span className="text-body font-medium text-gray-700">You owe:</span>
                  <span className="text-title-3 font-bold text-red-600">
                    ${balance.totalOwing.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl">
                  <span className="text-body font-medium text-gray-700">You're owed:</span>
                  <span className="text-title-3 font-bold text-green-600">
                    ${balance.totalOwed.toFixed(2)}
                  </span>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <span className="text-headline font-bold text-gray-800">Net balance:</span>
                    <span className={`text-title-2 font-black ${
                      netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-pulse space-y-4">
                <div className="h-16 bg-gray-200 rounded-2xl"></div>
                <div className="h-16 bg-gray-200 rounded-2xl"></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <h2 className="text-title-2 font-bold text-primary mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {activeChores.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <CheckSquare size={20} className="text-primary" />
                    <div>
                      <p className="text-body font-medium text-primary">
                        {activeChores.length} active chore{activeChores.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-caption text-secondary">Tap to manage</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setLocation('/chores')}
                    className="text-primary text-sm font-medium"
                  >
                    View
                  </button>
                </div>
              )}
              
              {recentMessages.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <MessageSquare size={20} className="text-primary" />
                    <div>
                      <p className="text-body font-medium text-primary">
                        {recentMessages.length} new message{recentMessages.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-caption text-secondary">
                        {recentMessages[recentMessages.length - 1]?.user?.firstName || 'Someone'} sent a message
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setLocation('/messages')}
                    className="text-primary text-sm font-medium"
                  >
                    View
                  </button>
                </div>
              )}
              
              {upcomingEvents.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <Calendar size={20} className="text-primary" />
                    <div>
                      <p className="text-body font-medium text-primary">
                        {upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-caption text-secondary">
                        Next: {upcomingEvents[0]?.title}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setLocation('/calendar')}
                    className="text-primary text-sm font-medium"
                  >
                    View
                  </button>
                </div>
              )}
              
              {activeChores.length === 0 && recentMessages.length === 0 && upcomingEvents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-subhead text-secondary">All caught up!</p>
                  <p className="text-caption text-tertiary mt-1">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}