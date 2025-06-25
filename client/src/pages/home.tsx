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
import { CheckSquare, DollarSign, Calendar, MessageSquare, Plus, Clock, User, ChevronRight, Settings } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  const handleCreateHousehold = () => {
    if (!newHousehold.name.trim()) return;
    
    createHouseholdMutation.mutate({
      name: newHousehold.name,
      rentAmount: newHousehold.rentAmount ? parseFloat(newHousehold.rentAmount) : null,
      rentDueDay: newHousehold.rentDueDay ? parseInt(newHousehold.rentDueDay) : null,
    });
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
            <p className="text-body text-secondary mt-1">Create or join a household to get started</p>
          </div>
        </div>
        <div className="px-4 py-6 space-y-4">
          <Card className="smart-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Household</h2>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary text-white py-3 rounded-xl font-semibold">
                    Create Household
                  </Button>
                </DialogTrigger>
                <DialogContent className="modal-content">
                  <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-gray-900">Create New Household</DialogTitle>
                  </DialogHeader>
                  <div className="px-6 pb-6 space-y-4">
                    <Input
                      placeholder="Household name"
                      value={newHousehold.name}
                      onChange={(e) => setNewHousehold({ ...newHousehold, name: e.target.value })}
                      className="w-full p-4 border border-gray-200 rounded-xl"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Monthly rent (optional)"
                      value={newHousehold.rentAmount}
                      onChange={(e) => setNewHousehold({ ...newHousehold, rentAmount: e.target.value })}
                      className="w-full p-4 border border-gray-200 rounded-xl"
                    />
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Rent due day (optional)"
                      value={newHousehold.rentDueDay}
                      onChange={(e) => setNewHousehold({ ...newHousehold, rentDueDay: e.target.value })}
                      className="w-full p-4 border border-gray-200 rounded-xl"
                    />
                    <Button 
                      onClick={handleCreateHousehold}
                      disabled={!newHousehold.name.trim() || createHouseholdMutation.isPending}
                      className="w-full bg-primary text-white py-3 rounded-xl font-semibold"
                    >
                      {createHouseholdMutation.isPending ? "Creating..." : "Create Household"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          
          <Card className="smart-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Join Household</h2>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl uppercase"
                />
                <Button 
                  onClick={() => {
                    if (!inviteCode.trim()) return;
                    // Handle join logic
                  }}
                  disabled={!inviteCode.trim()}
                  className="w-full bg-accent text-white py-3 rounded-xl font-semibold"
                >
                  Join Household
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
  const upcomingEvents = calendarEvents.filter((event: any) => 
    new Date(event.startDate) >= new Date(new Date().setHours(0, 0, 0, 0))
  ).slice(0, 2);
  const netBalance = (balance?.totalOwed || 0) - (balance?.totalOwing || 0);
  const firstName = user.firstName || user.email?.split('@')[0] || 'there';

  // Get current time greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  // Get next urgent chore
  const nextChore = activeChores.sort((a: any, b: any) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  })[0];

  // Get today's events
  const todayEvents = calendarEvents.filter((event: any) => {
    const eventDate = new Date(event.startDate).toDateString();
    const today = new Date().toDateString();
    return eventDate === today;
  });

  return (
    <div className="page-container">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">{greeting}, {firstName}</h1>
              <p className="page-subtitle">What needs your attention</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setLocation('/profile')}
                className="w-12 h-12 bg-gradient-to-br from-accent to-accent-hover rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <span className="text-white font-bold">
                  {firstName[0]?.toUpperCase() || '?'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Smart Cards Stack */}
      <div className="px-4 space-y-3 pb-4">
        {/* 1. Chore Card */}
        {nextChore ? (
          <div 
            className="smart-card interactive cursor-pointer animate-slide-up hover:scale-102"
            onClick={() => setLocation('/chores')}
            style={{ animationDelay: '100ms' }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary/15 rounded-lg flex items-center justify-center">
                    <CheckSquare size={16} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Next chore</h3>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-lg font-medium text-gray-900">{nextChore.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {nextChore.assignedUser && (
                      <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {nextChore.assignedUser.firstName?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-gray-500">
                      {nextChore.assignedUser?.firstName || 'Unassigned'}
                    </span>
                    {nextChore.dueDate && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-500">
                          Due {new Date(nextChore.dueDate).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <button className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                  Mark done
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="empty-state-card cursor-pointer animate-fade-in"
            onClick={() => setLocation('/chores')}
            style={{ animationDelay: '100ms' }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-green to-green-light rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <CheckSquare size={32} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">All caught up!</h3>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">No chores need your attention today</p>
            <button className="bg-accent text-white px-8 py-4 rounded-full font-bold shadow-lg transition-all duration-300">
              Add Chore
            </button>
          </div>
        )}

        {/* Bills Card */}
        {balance && (netBalance !== 0 || balance.totalOwed > 0 || balance.totalOwing > 0) ? (
          <Card 
            className="smart-card interactive cursor-pointer animate-slide-up"
            onClick={() => setLocation('/expenses')}
            style={{ animationDelay: '200ms' }}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange to-orange-light rounded-2xl flex items-center justify-center shadow-lg">
                  <DollarSign size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl leading-tight">Your balance</h3>
                  <p className="text-gray-600 text-base mt-1 font-medium">Money matters</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 mt-2" />
            </div>
            
            <div className="space-y-4">
              {balance.totalOwed > 0 && (
                <div className="flex justify-between items-center p-4 bg-green-light rounded-2xl">
                  <span className="font-semibold text-gray-700">You're owed</span>
                  <span className="font-bold text-green text-xl">+${balance.totalOwed}</span>
                </div>
              )}
              {balance.totalOwing > 0 && (
                <div className="flex justify-between items-center p-4 bg-red-light rounded-2xl">
                  <span className="font-semibold text-gray-700">You owe</span>
                  <span className="font-bold text-red text-xl">-${balance.totalOwing}</span>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div 
            className="empty-state-card cursor-pointer animate-fade-in"
            onClick={() => setLocation('/expenses')}
            style={{ animationDelay: '200ms' }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-orange to-orange-light rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <DollarSign size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">All settled!</h3>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">No outstanding bills to worry about</p>
            <button className="bg-accent text-white px-8 py-4 rounded-full font-bold shadow-lg transition-all duration-300">
              Add Expense
            </button>
          </div>
        )}

        {/* Calendar Card */}
        {todayEvents.length > 0 ? (
          <Card 
            className="smart-card interactive cursor-pointer animate-slide-up"
            onClick={() => setLocation('/calendar')}
            style={{ animationDelay: '400ms' }}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange to-orange-light rounded-2xl flex items-center justify-center shadow-lg">
                  <Calendar size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xl leading-tight">Today's events</h3>
                  <p className="text-gray-600 text-base mt-1 font-medium">{todayEvents.length} scheduled</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 mt-2" />
            </div>
            
            <div className="space-y-3">
              {todayEvents.slice(0, 2).map((event: any) => (
                <div key={event.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-light to-orange-light/50 rounded-2xl">
                  <div className="w-3 h-12 bg-orange rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{event.title}</p>
                    <p className="text-gray-600 font-medium">
                      {new Date(event.startDate).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <div 
            className="empty-state-card cursor-pointer animate-fade-in"
            onClick={() => setLocation('/calendar')}
            style={{ animationDelay: '400ms' }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-orange to-orange-light rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Calendar size={28} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Free day!</h3>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">No events scheduled for today</p>
            <button className="bg-accent text-white px-8 py-4 rounded-full font-bold shadow-lg transition-all duration-300">
              Add Event
            </button>
          </div>
        )}

        {/* 4. Chat Card */}
        {recentMessages.length > 0 ? (
          <div 
            className="smart-card interactive cursor-pointer"
            onClick={() => setLocation('/messages')}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MessageSquare size={16} className="text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Chat</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {recentMessages.length > 0 && (
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">{recentMessages.length}</span>
                    </div>
                  )}
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                {recentMessages.slice(0, 1).map((message: any) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-700">
                        {message.user.firstName?.[0] || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {message.user.firstName || 'Someone'}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{message.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(message.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="empty-state-card cursor-pointer animate-fade-in hover:scale-102"
            onClick={() => setLocation('/messages')}
            style={{ animationDelay: '400ms' }}
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageSquare size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-1">Start chatting!</h3>
              <p className="text-sm text-gray-500 mb-4">No messages yet</p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                Send message
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}