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
  ArrowLeft,
} from "lucide-react";
import { useLocation } from "wouter";
import { getProfileInitials } from "@/lib/nameUtils";

export default function Dashboard() {
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
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
      <div className="page-container page-transition">
        <div className="floating-header">
          <div className="page-header">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setLocation("/")}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all btn-animated"
                style={{
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-primary)'
                }}
                aria-label="Go back"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">
                  Join a household to view analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const completedChores = (chores as any[]).filter(
    (chore: any) => chore.status === "done",
  );
  const totalChores = (chores as any[]).length;
  const choreCompletionRate =
    totalChores > 0 ? (completedChores.length / totalChores) * 100 : 0;

  const totalExpenseAmount = (expenses as any[]).reduce(
    (sum: number, expense: any) => sum + parseFloat(expense.amount || 0),
    0,
  );
  const monthlyExpenses = (expenses as any[]).filter((expense: any) => {
    const expenseDate = new Date(expense.createdAt);
    const now = new Date();
    return (
      expenseDate.getMonth() === now.getMonth() &&
      expenseDate.getFullYear() === now.getFullYear()
    );
  });

  const upcomingEvents = (events as any[])
    .filter((event: any) => {
      const eventDate = new Date(event.startDate);
      const now = new Date();
      return eventDate > now;
    })
    .slice(0, 3);

  // Member performance
  const memberPerformance =
    (household as any).members?.map((member: any) => {
      const memberChores = (chores as any[]).filter(
        (chore: any) => chore.assignedTo === member.userId,
      );
      const completedMemberChores = memberChores.filter(
        (chore: any) => chore.status === "done",
      );
      const memberMessages = (messages as any[]).filter(
        (msg: any) => msg.userId === member.userId,
      );

      return {
        ...member,
        totalChores: memberChores.length,
        completedChores: completedMemberChores.length,
        completionRate:
          memberChores.length > 0
            ? (completedMemberChores.length / memberChores.length) * 100
            : 0,
        messageCount: memberMessages.length,
        streak: Math.max(...memberChores.map((c: any) => c.streak || 0), 0),
      };
    }) || [];

  const topPerformer = memberPerformance.sort(
    (a: any, b: any) => b.completionRate - a.completionRate,
  )[0];

  return (
    <div className="page-container page-transition">
      {/* Header */}
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLocation("/")}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all btn-animated"
              style={{
                background: 'var(--surface-secondary)',
                color: 'var(--text-primary)'
              }}
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="page-title">Performance Dashboard</h1>
              <p className="page-subtitle">
                {(household as any).name} household analytics
              </p>
            </div>
          </div>

          <div className="flex pt-[10px] space-x-2">
            {["week", "month", "all"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: selectedPeriod === period 
                    ? 'var(--primary)' 
                    : 'var(--surface-secondary)',
                  color: selectedPeriod === period 
                    ? 'white' 
                    : 'var(--text-secondary)',
                  border: '1px solid var(--border)'
                }}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-[205px] px-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Chore Completion
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {choreCompletionRate.toFixed(1)}%
                  </p>
                  <div className="flex items-center space-x-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-600 font-medium">
                      +12% from last week
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Monthly Spending
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${totalExpenseAmount.toFixed(0)}
                  </p>
                  <div className="flex items-center space-x-1 mt-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">
                      -8% from last month
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Active Members
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {(household as any).members?.length || 0}
                  </p>
                  <div className="flex items-center space-x-1 mt-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-purple-600 font-medium">
                      All engaged
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Upcoming Events
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {upcomingEvents.length}
                  </p>
                  <div className="flex items-center space-x-1 mt-2">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-orange-600 font-medium">
                      This week
                    </span>
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
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
              <Award className="w-5 h-5 text-primary" />
              <span>Member Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {memberPerformance.map((member: any, index: number) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-4 rounded-2xl"
                  style={{ background: 'var(--surface-secondary)' }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {getProfileInitials(member.user.firstName, member.user.lastName, member.user.email)}
                        </span>
                      </div>
                      {index === 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Award className="w-3 h-3 text-yellow-800" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {member.user.firstName ||
                          member.user.email?.split("@")[0]}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {member.completedChores}/{member.totalChores} chores
                        completed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        {member.completionRate.toFixed(0)}%
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Completion Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">
                        {member.streak}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Best Streak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {member.messageCount}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Messages</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
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
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{chore.title}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Completed by{" "}
                        {chore.assignedUser?.firstName || "Unknown"}
                      </p>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(
                        chore.completedAt || chore.updatedAt,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)'
          }}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
                <Clock className="w-5 h-5 text-primary" />
                <span>Upcoming Events</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event: any) => (
                    <div key={event.id} className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: event.color || "#3B82F6" }}
                      >
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {event.title}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(event.startDate).toLocaleDateString()} at{" "}
                          {new Date(event.startDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>No upcoming events</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Insights */}
        <Card className="glass-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2" style={{ color: 'var(--text-primary)' }}>
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
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                  Productivity Up
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Chore completion rate has improved by 12% this week. Keep up
                  the great teamwork!
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                  Budget Friendly
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Monthly expenses are 8% lower than last month. Excellent
                  financial management!
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                  Team Engaged
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  All household members are actively participating. Great
                  community spirit!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
