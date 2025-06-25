import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { CheckSquare, DollarSign, Calendar, MessageCircle, ArrowRight } from "lucide-react";
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

  if (!household) {
    return (
      <div className="page-container animate-page-enter">
        <div className="floating-header">
          <div className="page-header">
            <h1 className="page-title">Welcome</h1>
            <p className="page-subtitle">Let's get you set up</p>
          </div>
        </div>
        <div className="page-content">
          <div className="smart-card p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create or Join a Household</h2>
            <p className="text-gray-600 mb-6">Start managing your shared living space</p>
            <button 
              onClick={() => setLocation('/settings')}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold btn-animated"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeChores = chores.filter((chore: any) => chore.status !== 'done');
  const recentMessages = messages.slice(-3);
  const netBalance = (balance?.totalOwed || 0) - (balance?.totalOwing || 0);
  const firstName = user.firstName || user.email?.split('@')[0] || 'there';

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';

  const nextChore = activeChores.sort((a: any, b: any) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  })[0];

  const todayEvents = calendarEvents.filter((event: any) => {
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
              <p className="page-subtitle">{household.name}</p>
            </div>
            <button 
              onClick={() => setLocation('/profile')}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg btn-animated pl-[20px] pr-[20px]"
            >
              <span className="text-white font-bold text-lg">
                {firstName[0]?.toUpperCase() || '+'}
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="page-content space-y-6">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6 text-center animate-fade-in">
              <button 
                onClick={() => setLocation('/chores')}
                className="w-full transition-all btn-animated"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{activeChores.length}</p>
                <p className="text-sm text-gray-600">Active chores</p>
              </button>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-6 text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
              <button 
                onClick={() => setLocation('/expenses')}
                className="w-full transition-all btn-animated"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${Math.abs(netBalance).toFixed(0)}
                </p>
                <p className="text-sm text-gray-600">
                  {netBalance > 0 ? 'Owed to you' : netBalance < 0 ? 'You owe' : 'All settled'}
                </p>
              </button>
            </CardContent>
          </Card>

          {/* Additional stats for larger screens */}
          <Card className="glass-card hidden md:block">
            <CardContent className="p-6 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
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

          <Card className="glass-card hidden md:block">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Today's Priority */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Today's Priority</h3>
            
            {nextChore ? (
              <Card className="glass-card">
                <CardContent className="p-6">
                  <button 
                    onClick={() => setLocation('/chores')}
                    className="w-full text-left transition-all hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <p className="text-sm font-medium text-primary">Next up</p>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">{nextChore.title}</h4>
                        {nextChore.description && (
                          <p className="text-sm text-gray-600 mb-3">{nextChore.description}</p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <span>{nextChore.assignedUser?.firstName || 'Unassigned'}</span>
                          {nextChore.dueDate && (
                            <>
                              <span>•</span>
                              <span>Due {new Date(nextChore.dueDate).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={20} className="text-gray-400 ml-4" />
                    </div>
                  </button>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-6">
                  <button 
                    onClick={() => setLocation('/chores')}
                    className="w-full text-center border-2 border-dashed border-gray-200 py-8 transition-all hover:border-gray-300"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <CheckSquare size={24} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600 mb-6">No chores need your attention today</p>
                    <div className="flex items-center justify-center space-x-2 text-blue-600 font-medium">
                      <span>View Dashboard</span>
                      <ArrowRight size={16} />
                    </div>
                  </button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
              <button 
                onClick={() => setLocation('/messages')}
                className="text-sm text-primary font-medium transition-colors"
              >
                View all
              </button>
            </div>
            
            {recentMessages.length > 0 ? (
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {recentMessages.map((message: any) => (
                      <div key={message.id} className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">
                            {message.user.firstName?.[0] || message.user.email?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {message.user.firstName || message.user.email?.split('@')[0]}
                            </p>
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card">
                <CardContent className="p-6">
                  <button 
                    onClick={() => setLocation('/messages')}
                    className="w-full text-center border-2 border-dashed border-gray-200 py-8 transition-all"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <MessageCircle size={24} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Start the conversation</h3>
                    <p className="text-gray-600 mb-6">No messages yet. Say hello to your roommates!</p>
                    <div className="flex items-center justify-center space-x-2 text-primary font-medium">
                      <span>Send Message</span>
                      <ArrowRight size={16} />
                    </div>
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        


      </div>
    </div>
  );
}