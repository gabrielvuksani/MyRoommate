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
  MessageCircle,
  Plus,
  ArrowUpRight,
  Activity,
  Star,
  Zap,
  Home as HomeIcon,
} from "lucide-react";
import { useLocation } from "wouter";
import { getProfileInitials } from "@/lib/nameUtils";
import { QuickAvatar } from "@/components/ProfileAvatar";
import BackButton from "../components/back-button";
import { format, isThisWeek, isThisMonth, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export default function Dashboard() {
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);

    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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
      <div className="min-h-screen page-transition" style={{ background: 'var(--background)' }}>
        <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
          <div className="page-header">
            <div className="flex items-center space-x-4">
              <BackButton to="/" />
              <div>
                <h1 className="page-title">Household Dashboard</h1>
                <p className="page-subtitle">Join a household to view insights</p>
              </div>
            </div>
          </div>
        </div>

        <div className="content-with-header px-6">
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                No Household Data
              </h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Join or create a household to view detailed analytics and insights about your shared living.
              </p>
              <button
                onClick={() => setLocation("/")}
                className="px-6 py-3 rounded-xl font-medium transition-all btn-animated"
                style={{ background: 'var(--primary)', color: 'white' }}
              >
                Go to Home
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Helper function to filter data by selected period
  const filterByPeriod = (items: any[], dateField: string = 'createdAt') => {
    if (selectedPeriod === 'all') return items;
    
    const now = new Date();
    let startDate: Date, endDate: Date;
    
    if (selectedPeriod === 'week') {
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
    } else {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }
    
    return items.filter((item: any) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  // Calculate current period metrics
  const filteredChores = filterByPeriod(chores as any[]);
  const filteredExpenses = filterByPeriod(expenses as any[]);
  const filteredMessages = filterByPeriod(messages as any[]);
  const filteredEvents = filterByPeriod(events as any[], 'startDate');

  const completedChores = filteredChores.filter((chore: any) => chore.status === "done");
  const totalChores = filteredChores.length;
  const choreCompletionRate = totalChores > 0 ? (completedChores.length / totalChores) * 100 : 0;

  const totalExpenseAmount = filteredExpenses.reduce(
    (sum: number, expense: any) => sum + parseFloat(expense.amount || 0), 0
  );

  const upcomingEvents = (events as any[])
    .filter((event: any) => {
      const eventDate = new Date(event.startDate);
      return eventDate > new Date();
    })
    .slice(0, 5);

  // Enhanced member performance with activity scores
  const memberPerformance = (household as any).members?.map((member: any) => {
    const memberChores = (chores as any[]).filter((chore: any) => chore.assignedTo === member.userId);
    const completedMemberChores = memberChores.filter((chore: any) => chore.status === "done");
    const memberMessages = (messages as any[]).filter((msg: any) => msg.userId === member.userId);
    const memberExpenses = (expenses as any[]).filter((expense: any) => expense.paidBy === member.userId);

    const completionRate = memberChores.length > 0 ? (completedMemberChores.length / memberChores.length) * 100 : 0;
    const activityScore = memberMessages.length + memberExpenses.length + completedMemberChores.length;

    return {
      ...member,
      totalChores: memberChores.length,
      completedChores: completedMemberChores.length,
      completionRate,
      messageCount: memberMessages.length,
      expenseCount: memberExpenses.length,
      activityScore,
      streak: Math.max(...memberChores.map((c: any) => c.streak || 0), 0),
    };
  }) || [];

  const topPerformer = memberPerformance.sort((a: any, b: any) => b.activityScore - a.activityScore)[0];

  // Recent activity timeline
  const recentActivity = [
    ...completedChores.map((chore: any) => ({
      type: 'chore',
      title: chore.title,
      user: chore.assignedToName || 'Someone',
      time: chore.updatedAt || chore.createdAt,
      icon: CheckCircle,
      color: 'emerald'
    })),
    ...filteredExpenses.map((expense: any) => ({
      type: 'expense',
      title: `$${expense.amount} - ${expense.description}`,
      user: expense.paidByName || 'Someone',
      time: expense.createdAt,
      icon: DollarSign,
      color: 'blue'
    })),
    ...filteredMessages.slice(-5).map((message: any) => ({
      type: 'message',
      title: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
      user: message.user?.firstName || 'Someone',
      time: message.createdAt,
      icon: MessageCircle,
      color: 'purple'
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  return (
    <div className="min-h-screen page-transition" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center space-x-4">
            <BackButton to="/" />
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">
                {(household as any).name} household insights
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-with-header-compact px-6 space-y-6 pb-32">
        {/* Time Period Filter */}
        <div className="flex justify-center">
          <div
            className="flex space-x-1 p-1 rounded-2xl"
            style={{ background: "var(--surface-secondary)" }}
          >
            {["week", "month", "all"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background:
                    selectedPeriod === period
                      ? "var(--primary)"
                      : "transparent",
                  color:
                    selectedPeriod === period
                      ? "white"
                      : "var(--text-secondary)",
                }}
              >
                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card cursor-pointer hover:scale-[1.02] transition-all duration-200" onClick={() => setLocation("/chores")}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    Task Completion
                  </p>
                  <p className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                    {choreCompletionRate.toFixed(0)}%
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    {completedChores.length} of {totalChores}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card cursor-pointer hover:scale-[1.02] transition-all duration-200" onClick={() => setLocation("/expenses")}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    Total Spending
                  </p>
                  <p className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                    ${totalExpenseAmount.toFixed(0)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    {filteredExpenses.length} expenses
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card cursor-pointer hover:scale-[1.02] transition-all duration-200" onClick={() => setLocation("/messages")}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    Messages
                  </p>
                  <p className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                    {filteredMessages.length}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    {selectedPeriod === 'week' ? 'This week' : selectedPeriod === 'month' ? 'This month' : 'Total'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card cursor-pointer hover:scale-[1.02] transition-all duration-200" onClick={() => setLocation("/calendar")}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    Upcoming Events
                  </p>
                  <p className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
                    {upcomingEvents.length}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                    Next 7 days
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Household Members Performance */}
        {memberPerformance.length > 0 && (
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2" style={{ color: "var(--text-primary)" }}>
                <Users className="w-5 h-5" style={{ color: "var(--primary)" }} />
                <span>Household Members</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {memberPerformance.map((member: any, index: number) => (
                  <div
                    key={member.userId}
                    className="p-4 rounded-2xl transition-all duration-200"
                    style={{ background: "var(--surface-secondary)" }}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <QuickAvatar user={member.user} size="md" gradientType="blue" />
                      <div className="flex-1">
                        <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                          {member.user.firstName || member.user.email?.split("@")[0]}
                        </h3>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {member.user.role === 'admin' ? 'Admin' : 'Member'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                          {member.completedChores}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          Tasks Done
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600">
                          {member.messageCount}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          Messages
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-emerald-600">
                          ${member.expenseCount > 0 ? (totalExpenseAmount / memberPerformance.filter((m: any) => m.expenseCount > 0).length).toFixed(0) : '0'}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          Expenses
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Performer & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2" style={{ color: "var(--text-primary)" }}>
                <Activity className="w-5 h-5" style={{ color: "var(--primary)" }} />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentActivity.length > 0 ? recentActivity.map((activity: any, index: number) => {
                  const IconComponent = activity.icon;
                  const colorClass = activity.color === 'emerald' ? 'from-emerald-400 to-emerald-600' :
                                   activity.color === 'blue' ? 'from-blue-400 to-blue-600' :
                                   'from-purple-400 to-purple-600';
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 bg-gradient-to-br ${colorClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                          {activity.title}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {activity.user} • {format(new Date(activity.time), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-secondary)" }} />
                    <p style={{ color: "var(--text-secondary)" }}>
                      No recent activity
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Top Performer */}
          {topPerformer && (
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2" style={{ color: "var(--text-primary)" }}>
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span>Top Performer</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex items-center space-x-4 p-4 rounded-2xl" style={{ background: "var(--surface-secondary)" }}>
                  <div className="relative">
                    <QuickAvatar user={topPerformer.user} size="lg" gradientType="emerald" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="w-3 h-3 text-yellow-800" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {topPerformer.user.firstName || topPerformer.user.email?.split("@")[0]}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      Most active this {selectedPeriod}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="text-center">
                        <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                          {topPerformer.activityScore}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          Activity Score
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600">
                          {topPerformer.completionRate.toFixed(0)}%
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          Tasks Done
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2" style={{ color: "var(--text-primary)" }}>
              <Zap className="w-5 h-5" style={{ color: "var(--primary)" }} />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setLocation("/add-expense")}
                className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02] btn-animated"
                style={{ background: "var(--surface-secondary)" }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  Add Expense
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Split a new bill or expense
                </p>
              </button>

              <button
                onClick={() => setLocation("/chores")}
                className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02] btn-animated"
                style={{ background: "var(--surface-secondary)" }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center mb-3">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  Create Task
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Assign a new chore
                </p>
              </button>

              <button
                onClick={() => setLocation("/calendar")}
                className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02] btn-animated"
                style={{ background: "var(--surface-secondary)" }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  Add Event
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Schedule something new
                </p>
              </button>

              <button
                onClick={() => setLocation("/messages")}
                className="p-4 rounded-2xl text-left transition-all hover:scale-[1.02] btn-animated"
                style={{ background: "var(--surface-secondary)" }}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-3">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  Send Message
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Chat with household
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
