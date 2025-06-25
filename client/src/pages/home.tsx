import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { CheckSquare, DollarSign, Calendar, MessageCircle, ArrowRight } from "lucide-react";
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
    <div className="page-container animate-page-enter">
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
              className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg btn-animated"
            >
              <span className="text-white font-bold text-lg">
                {firstName[0]?.toUpperCase() || '?'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="page-content space-y-6">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="smart-card p-4 text-center animate-fade-in">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="text-white" size={18} />
            </div>
            <p className="text-xl font-bold text-gray-900">{activeChores.length}</p>
            <p className="text-xs text-gray-600">Active chores</p>
          </div>
          
          <div className="smart-card p-4 text-center animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <DollarSign className="text-white" size={18} />
            </div>
            <p className="text-xl font-bold text-gray-900">
              ${Math.abs(netBalance).toFixed(0)}
            </p>
            <p className="text-xs text-gray-600">
              {netBalance > 0 ? 'Owed to you' : netBalance < 0 ? 'You owe' : 'All settled'}
            </p>
          </div>
        </div>

        {/* Today's Priority */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Today's Priority</h3>
          
          {nextChore ? (
            <div 
              className="smart-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-primary cursor-pointer animate-slide-up btn-animated"
              style={{ animationDelay: '200ms' }}
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
            </div>
          ) : (
            <div 
              className="smart-card p-6 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-200 cursor-pointer animate-scale-in btn-animated"
              style={{ animationDelay: '200ms' }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckSquare size={18} className="text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600 mb-4 text-sm">No chores need your attention today</p>
              <div className="flex items-center justify-center space-x-2 text-primary font-medium text-sm">
                <span>View Dashboard</span>
                <ArrowRight size={14} />
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            <button 
              onClick={() => setLocation('/messages')}
              className="text-sm text-primary font-medium hover:text-primary/80 transition-colors"
            >
              View all
            </button>
          </div>
          
          {recentMessages.length > 0 ? (
            <div className="smart-card p-5 animate-slide-up" style={{ animationDelay: '250ms' }}>
              <div className="space-y-3">
                {recentMessages.map((message: any) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0">
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
            </div>
          ) : (
            <div 
              className="smart-card p-6 text-center border-2 border-dashed border-gray-200 cursor-pointer animate-fade-in btn-animated"
              onClick={() => setLocation('/messages')}
              style={{ animationDelay: '250ms' }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={18} className="text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Start the conversation</h3>
              <p className="text-gray-600 mb-4 text-sm">No messages yet. Say hello to your roommates!</p>
              <div className="flex items-center justify-center space-x-2 text-primary font-medium text-sm">
                <span>Send Message</span>
                <ArrowRight size={14} />
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setLocation('/expenses')}
            className="smart-card p-4 text-left hover:shadow-lg transition-all btn-animated animate-slide-in-left"
            style={{ animationDelay: '300ms' }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-3">
              <DollarSign className="text-white" size={18} />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Split Bill</h4>
            <p className="text-xs text-gray-600">Add new expense</p>
          </button>
          
          <button 
            onClick={() => setLocation('/calendar')}
            className="smart-card p-4 text-left hover:shadow-lg transition-all btn-animated animate-slide-in-right"
            style={{ animationDelay: '350ms' }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-3">
              <Calendar className="text-white" size={18} />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Add Event</h4>
            <p className="text-xs text-gray-600">Schedule something</p>
          </button>
        </div>
      </div>
    </div>
  );
}