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
        {/* Quick Actions - Things 3 inspired */}
        <div className="space-y-3">
          <button
            onClick={() => setLocation('/chores')}
            className="w-full flex items-center justify-between p-5 bg-surface border border-border-subtle rounded-2xl shadow-soft hover:shadow-medium transition-all duration-150 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <CheckSquare size={20} className="text-primary" />
              </div>
              <div className="text-left">
                <p className="text-body font-semibold text-primary">Chores</p>
                <p className="text-caption text-secondary">
                  {activeChores.length} active task{activeChores.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="w-6 h-6 bg-tertiary/30 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <span className="text-xs text-tertiary">→</span>
            </div>
          </button>

          <button
            onClick={() => setLocation('/expenses')}
            className="w-full flex items-center justify-between p-5 bg-surface border border-border-subtle rounded-2xl shadow-soft hover:shadow-medium transition-all duration-150 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <DollarSign size={20} className="text-accent" />
              </div>
              <div className="text-left">
                <p className="text-body font-semibold text-primary">Expenses</p>
                <p className="text-caption text-secondary">
                  {netBalance >= 0 ? `+$${netBalance.toFixed(2)} owed to you` : `$${Math.abs(netBalance).toFixed(2)} you owe`}
                </p>
              </div>
            </div>
            <div className="w-6 h-6 bg-tertiary/30 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <span className="text-xs text-tertiary">→</span>
            </div>
          </button>

          <button
            onClick={() => setLocation('/calendar')}
            className="w-full flex items-center justify-between p-5 bg-surface border border-border-subtle rounded-2xl shadow-soft hover:shadow-medium transition-all duration-150 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
                <Calendar size={20} className="text-warning" />
              </div>
              <div className="text-left">
                <p className="text-body font-semibold text-primary">Calendar</p>
                <p className="text-caption text-secondary">
                  {upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="w-6 h-6 bg-tertiary/30 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <span className="text-xs text-tertiary">→</span>
            </div>
          </button>

          <button
            onClick={() => setLocation('/messages')}
            className="w-full flex items-center justify-between p-5 bg-surface border border-border-subtle rounded-2xl shadow-soft hover:shadow-medium transition-all duration-150 group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                <MessageSquare size={20} className="text-secondary" />
              </div>
              <div className="text-left">
                <p className="text-body font-semibold text-primary">Messages</p>
                <p className="text-caption text-secondary">
                  {recentMessages.length} recent message{recentMessages.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="w-6 h-6 bg-tertiary/30 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <span className="text-xs text-tertiary">→</span>
            </div>
          </button>
        </div>

        {/* Splitwise-inspired Balance Summary */}
        {balance && (netBalance !== 0 || balance.totalOwed > 0 || balance.totalOwing > 0) && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-caption text-secondary mb-1">Your balance</p>
                <p className={`text-title-1 font-bold mb-6 ${
                  netBalance >= 0 ? 'text-accent' : 'text-destructive'
                }`}>
                  {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
                </p>
                
                {(balance.totalOwed > 0 || balance.totalOwing > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-caption text-secondary">You owe</p>
                      <p className="text-headline font-semibold text-destructive">${balance.totalOwing.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-caption text-secondary">You're owed</p>
                      <p className="text-headline font-semibold text-accent">${balance.totalOwed.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity - Notion inspired */}
        {(recentMessages.length > 0 || upcomingEvents.length > 0) && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <h3 className="text-headline font-semibold text-primary mb-4">What's new</h3>
              <div className="space-y-3">
                {recentMessages.slice(0, 2).map((message: any, index: number) => (
                  <div key={message.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer" onClick={() => setLocation('/messages')}>
                    <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-secondary text-sm font-medium">
                        {message.user.firstName?.[0] || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body text-primary truncate">{message.content}</p>
                      <p className="text-caption text-secondary">
                        {message.user.firstName} • {new Date(message.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {upcomingEvents.slice(0, 1).map((event: any) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer" onClick={() => setLocation('/calendar')}>
                    <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar size={16} className="text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body text-primary truncate">{event.title}</p>
                      <p className="text-caption text-secondary">
                        {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {event.creator?.firstName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}