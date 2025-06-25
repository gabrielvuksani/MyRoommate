import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { CheckSquare, DollarSign, Calendar, MessageCircle, ArrowRight, Home as HomeIcon, Brain, Target, BarChart3, Award, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  const { data: chores = [] } = useQuery({
    queryKey: ["/api/chores"],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/messages"],
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ["/api/calendar"],
  });

  const { data: balance } = useQuery({
    queryKey: ["/api/balance"],
  });

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show loading state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show onboarding if no household
  if (!household) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full p-8 text-center">
          <CardContent>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <HomeIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to MyRoommate</h1>
            <p className="text-gray-600 mb-8">Get started by creating or joining a household</p>
            <div className="space-y-3">
              <button 
                onClick={() => setLocation('/onboarding')}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-all"
              >
                Create or Join a Household
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeChores = (chores as any[]).filter((chore: any) => chore.status !== 'done');
  const recentMessages = (messages as any[]).slice().reverse().slice(0, 3);
  const netBalance = ((balance as any)?.totalOwed || 0) - ((balance as any)?.totalOwing || 0);
  const firstName = (user as any)?.firstName || (user as any)?.email?.split('@')[0] || 'there';

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const nextChore = activeChores.sort((a: any, b: any) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  })[0];

  const todayEvents = (calendarEvents as any[]).filter((event: any) => {
    const eventDate = new Date(event.startDate).toDateString();
    const today = new Date().toDateString();
    return eventDate === today;
  });

  return (
    <div className="page-container page-transition">
      {/* Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">{greeting}, {firstName}</h1>
              <p className="page-subtitle">{(household as any)?.name}</p>
            </div>
            <button 
              onClick={() => setLocation('/profile')}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg btn-animated p-[20px] nav-transition transition-all hover:scale-[1.05] animate-fade-in"
            >
              <span className="text-white font-bold text-lg">
                {firstName[0]?.toUpperCase() || '?'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="space-y-8 animate-fade-in">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6 text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
              <button 
                onClick={() => setLocation('/chores')}
                className="w-full transition-all btn-animated"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{activeChores.length}</p>
                <p className="text-sm text-gray-600">Active chores</p>
              </button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
              <button 
                onClick={() => setLocation('/expenses')}
                className="w-full transition-all btn-animated"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="text-white" size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center space-x-1">
                    <span className="text-2xl font-bold">${Math.abs(netBalance).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    <span className="text-sm">{netBalance >= 0 ? "You're owed" : "You owe"}</span>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6 text-center animate-fade-in" style={{ animationDelay: '250ms' }}>
              <button 
                onClick={() => setLocation('/calendar')}
                className="w-full transition-all btn-animated"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{todayEvents.length}</p>
                <p className="text-sm text-gray-600">Today's events</p>
              </button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
              <button 
                onClick={() => setLocation('/messages')}
                className="w-full transition-all btn-animated"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{recentMessages.length}</p>
                <p className="text-sm text-gray-600">New messages</p>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Today's Focus Section */}
        <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">
                    Today's Focus
                  </h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-700">
                  {(() => {
                    const today = new Date();
                    const todayEvents = (calendarEvents as any[]).filter((event: any) => {
                      const eventDate = new Date(event.startDate);
                      return eventDate.toDateString() === today.toDateString();
                    });
                    const urgentChores = (chores as any[]).filter((chore: any) => {
                      if (chore.status === 'done' || !chore.dueDate) return false;
                      const dueDate = new Date(chore.dueDate);
                      const diffTime = dueDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 2;
                    });

                    if (todayEvents.length > 0) {
                      return `You have ${todayEvents.length} event${todayEvents.length > 1 ? 's' : ''} scheduled for today.`;
                    } else if (urgentChores.length > 0) {
                      return `You have ${urgentChores.length} urgent chore${urgentChores.length > 1 ? 's' : ''} due soon.`;
                    } else if (nextChore) {
                      return `Your next task: ${nextChore.title}`;
                    } else {
                      return "You're all caught up! Great job staying organized.";
                    }
                  })()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">
                  Today's Schedule
                </h4>
              </div>
              <div className="space-y-2">
                {(() => {
                  const today = new Date();
                  const todayEvents = (calendarEvents as any[]).filter((event: any) => {
                    const eventDate = new Date(event.startDate);
                    return eventDate.toDateString() === today.toDateString();
                  }).slice(0, 3);

                  return todayEvents.length > 0 ? todayEvents.map((event: any) => (
                    <div key={event.id} className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: event.color || '#3B82F6' }}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">No events scheduled for today</p>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card animate-fade-in" style={{ animationDelay: '600ms' }}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-bold text-gray-900">
                  Priority Tasks
                </h4>
              </div>
              <div className="space-y-2">
                {(() => {
                  const today = new Date();
                  const priorityChores = (chores as any[])
                    .filter((chore: any) => chore.status !== 'done')
                    .sort((a: any, b: any) => {
                      const aUrgent = a.dueDate ? new Date(a.dueDate).getTime() - today.getTime() : Infinity;
                      const bUrgent = b.dueDate ? new Date(b.dueDate).getTime() - today.getTime() : Infinity;
                      return aUrgent - bUrgent;
                    })
                    .slice(0, 3);

                  return priorityChores.length > 0 ? priorityChores.map((chore: any) => (
                    <div key={chore.id} className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{chore.title}</p>
                        {chore.dueDate && (
                          <p className="text-xs text-gray-500">
                            Due {new Date(chore.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">No pending tasks</p>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '700ms' }}>
          <button 
            onClick={() => setLocation('/expenses')}
            className="glass-card p-6 text-left hover:scale-[1.02] transition-all btn-animated"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Split a Bill</h3>
                  <p className="text-sm text-gray-600">Add and split new expenses</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
          
          <button 
            onClick={() => setLocation('/calendar')}
            className="glass-card p-6 text-left hover:scale-[1.02] transition-all btn-animated"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Add Event</h3>
                  <p className="text-sm text-gray-600">Schedule household activities</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Household Performance */}
        <div className="animate-fade-in" style={{ animationDelay: '800ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Household Performance</h2>
            <button 
              onClick={() => setLocation('/dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const completedChores = (chores as any[]).filter((c: any) => c.status === 'done');
              const totalChores = (chores as any[]).length;
              const completionRate = totalChores > 0 ? (completedChores.length / totalChores) * 100 : 0;
              
              const memberPerformance = (household as any)?.members?.map((member: any) => {
                const memberChores = (chores as any[]).filter((c: any) => c.assignedTo === member.userId);
                const completedMemberChores = memberChores.filter((c: any) => c.status === 'done');
                return {
                  ...member,
                  completionRate: memberChores.length > 0 ? (completedMemberChores.length / memberChores.length) * 100 : 0,
                };
              }) || [];
              
              const topPerformer = memberPerformance.sort((a: any, b: any) => b.completionRate - a.completionRate)[0];
              const activeChores = (chores as any[]).filter((c: any) => c.status !== 'done');
              
              return (
                <>
                  <Card className="glass-card">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{completionRate.toFixed(0)}%</p>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-card">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{topPerformer?.user?.firstName || 'Team'}</p>
                      <p className="text-sm text-gray-600">Top Performer</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-card">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{activeChores.length}</p>
                      <p className="text-sm text-gray-600">Active Tasks</p>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}