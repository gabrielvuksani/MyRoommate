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
import { CheckSquare, DollarSign, Calendar, MessageSquare, ChevronRight, Bell, Settings } from "lucide-react";

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
          <div className="px-4 py-6">
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
      {/* Apple-standard Header */}
      <div className="floating-header">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-large-title font-bold text-primary">Good morning</h1>
              <p className="text-body text-secondary mt-1">
                {firstName}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setLocation('/settings')}
                className="w-11 h-11 bg-surface-secondary/50 rounded-full flex items-center justify-center hover:bg-surface-secondary transition-colors"
              >
                <Settings size={20} className="text-secondary" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-content space-y-6">
        {/* Dashboard Cards - Airbnb style */}
        <div className="space-y-4">
          {/* Balance Summary Card */}
          {balance && (netBalance !== 0 || balance.totalOwed > 0 || balance.totalOwing > 0) && (
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-footnote text-secondary">Your balance</p>
                    <p className={`text-title-1 font-semibold ${
                      netBalance >= 0 ? 'text-accent' : 'text-destructive'
                    }`}>
                      {netBalance >= 0 ? '+' : ''}${Math.abs(netBalance).toFixed(2)}
                    </p>
                  </div>
                  <button 
                    onClick={() => setLocation('/expenses')}
                    className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center"
                  >
                    <ChevronRight size={16} className="text-primary" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className="glass-card cursor-pointer hover:shadow-medium transition-all duration-300"
              onClick={() => setLocation('/chores')}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary/15 rounded-lg flex items-center justify-center">
                    <CheckSquare size={16} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-primary">Chores</p>
                    <p className="text-footnote text-secondary truncate">
                      {activeChores.length} active
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="glass-card cursor-pointer hover:shadow-medium transition-all duration-300"
              onClick={() => setLocation('/calendar')}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-warning/15 rounded-lg flex items-center justify-center">
                    <Calendar size={16} className="text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-primary">Calendar</p>
                    <p className="text-footnote text-secondary truncate">
                      {upcomingEvents.length} upcoming
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          {(recentMessages.length > 0 || activeChores.length > 0) && (
            <Card className="glass-card">
              <CardContent className="p-4">
                <h3 className="text-headline font-semibold text-primary mb-3">Recent activity</h3>
                <div className="space-y-3">
                  {recentMessages.slice(0, 2).map((message: any) => (
                    <div 
                      key={message.id} 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                      onClick={() => setLocation('/messages')}
                    >
                      <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                        <span className="text-secondary text-sm font-medium">
                          {message.user.firstName?.[0] || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body text-primary truncate">{message.content}</p>
                        <p className="text-footnote text-secondary">
                          {message.user.firstName} • {new Date(message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {activeChores.slice(0, 1).map((chore: any) => (
                    <div 
                      key={chore.id} 
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                      onClick={() => setLocation('/chores')}
                    >
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <CheckSquare size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body text-primary truncate">{chore.title}</p>
                        <p className="text-footnote text-secondary">
                          {chore.assignedUser?.firstName || 'Unassigned'} • Due {chore.dueDate ? new Date(chore.dueDate).toLocaleDateString() : 'soon'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {recentMessages.length === 0 && activeChores.length === 0 && upcomingEvents.length === 0 && (
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckSquare size={24} className="text-tertiary" />
                </div>
                <h3 className="text-headline font-semibold text-primary mb-1">All caught up</h3>
                <p className="text-body text-secondary mb-4">No recent activity to show</p>
                <Button 
                  onClick={() => setLocation('/chores')}
                  className="bg-primary text-white px-6 py-2 rounded-lg text-body font-medium"
                >
                  Add a chore
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}