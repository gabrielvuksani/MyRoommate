import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckCircle, 
  DollarSign, 
  Calendar,
  Target,
  Award,
  Clock,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  const { data: chores = [] } = useQuery({
    queryKey: ["/api/chores"],
    enabled: !!household,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
    enabled: !!household,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/calendar"],
    enabled: !!household,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/messages"],
    enabled: !!household,
  });

  if (!household) {
    return (
      <div className="page-container page-transition">
        <div className="floating-header">
          <div className="page-header">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setLocation('/')}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Join a household to view analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const completedChores = chores.filter((chore: any) => chore.status === 'done');
  const totalChores = chores.length;
  const choreCompletionRate = totalChores > 0 ? (completedChores.length / totalChores) * 100 : 0;
  
  const totalExpenseAmount = expenses.reduce((sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0);
  const monthlyExpenses = expenses.filter((expense: any) => {
    const expenseDate = new Date(expense.createdAt);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  });

  const upcomingEvents = events.filter((event: any) => {
    const eventDate = new Date(event.startDate);
    const now = new Date();
    return eventDate > now;
  }).slice(0, 3);

  // Member performance
  const memberPerformance = household.members?.map((member: any) => {
    const memberChores = chores.filter((chore: any) => chore.assignedTo === member.userId);
    const completedMemberChores = memberChores.filter((chore: any) => chore.status === 'done');
    const memberMessages = messages.filter((msg: any) => msg.userId === member.userId);
    
    return {
      ...member,
      totalChores: memberChores.length,
      completedChores: completedMemberChores.length,
      completionRate: memberChores.length > 0 ? (completedMemberChores.length / memberChores.length) * 100 : 0,
      messageCount: memberMessages.length,
      streak: Math.max(...memberChores.map((c: any) => c.streak || 0), 0)
    };
  }) || [];

  const topPerformer = memberPerformance.sort((a, b) => b.completionRate - a.completionRate)[0];

  return (
    <div className="page-container page-transition">
      {/* Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLocation('/')}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="page-title">Performance Dashboard</h1>
              <p className="page-subtitle">{household.name} household analytics</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {['week', 'month', 'all'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedPeriod === period 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-content space-y-6 pt-40">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Chore Completion</p>
                  <p className="text-2xl font-bold text-gray-900">{choreCompletionRate.toFixed(1)}%</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600 font-medium">+12% from last week</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Monthly Spending</p>
                  <p className="text-2xl font-bold text-gray-900">${totalExpenseAmount.toFixed(0)}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">-8% from last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">{household.members?.length || 0}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-purple-600 font-medium">All engaged</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Upcoming Events</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</p>
                  <div className="flex items-center space-x-1 mt-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-orange-600 font-medium">This week</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member Performance */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-primary" />
              <span>Member Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {memberPerformance.map((member: any, index: number) => (
                <div key={member.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {member.user.firstName?.[0] || member.user.email?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Award className="w-3 h-3 text-yellow-800" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {member.user.firstName || member.user.email?.split('@')[0]}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {member.completedChores}/{member.totalChores} chores completed
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{member.completionRate.toFixed(0)}%</p>
                      <p className="text-xs text-gray-500">Completion Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{member.streak}</p>
                      <p className="text-xs text-gray-500">Best Streak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{member.messageCount}</p>
                      <p className="text-xs text-gray-500">Messages</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary" />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {completedChores.slice(0, 5).map((chore: any) => (
                  <div key={chore.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{chore.title}</p>
                      <p className="text-sm text-gray-600">
                        Completed by {chore.assignedUser?.firstName || 'Unknown'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(chore.completedAt || chore.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>Upcoming Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? upcomingEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: event.color || '#3B82F6' }}
                    >
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.startDate).toLocaleDateString()} at{' '}
                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No upcoming events</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Insights */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span>Household Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Productivity Up</h3>
                <p className="text-gray-600 text-sm">
                  Chore completion rate has improved by 12% this week. Keep up the great teamwork!
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Budget Friendly</h3>
                <p className="text-gray-600 text-sm">
                  Monthly expenses are 8% lower than last month. Excellent financial management!
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Team Engaged</h3>
                <p className="text-gray-600 text-sm">
                  All household members are actively participating. Great community spirit!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}