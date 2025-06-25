import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  CheckSquare,
  DollarSign,
  Calendar,
  MessageCircle,
  ArrowRight,
  Home as HomeIcon,
  Brain,
  Target,
  BarChart3,
  Award,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation, Link } from "wouter";
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
    // Scroll to top when page loads
    window.scrollTo(0, 0);

    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!household) {
    return (
      <div className="pt-40 px-6 space-y-6 animate-page-enter">
        <div className="floating-header">
          <div className="page-header">
            <h1 className="page-title">Welcome</h1>
            <p className="page-subtitle">Let's get you set up</p>
          </div>
        </div>
        <div className="page-content">
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
                <HomeIcon size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Create or Join a Household
              </h2>
              <p className="text-gray-600 mb-8">
                Start managing your shared living space with roommates
              </p>
              <button
                onClick={() => setLocation("/onboarding")}
                className="bg-primary text-white px-8 py-4 rounded-xl font-semibold btn-animated shadow-lg hover:shadow-xl transition-all"
              >
                Get Started
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const activeChores = chores.filter((chore: any) => chore.status !== "done");
  const recentMessages = messages.slice().reverse().slice(0, 3);
  const netBalance = (balance?.totalOwed || 0) - (balance?.totalOwing || 0);
  const firstName = user.firstName || user.email?.split("@")[0] || "there";

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
        ? "Good afternoon"
        : "Good evening";

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
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="page-title">
                {greeting}, <span className="truncate">{firstName}</span>
              </h1>
              <p className="page-subtitle truncate">{household.name}</p>
            </div>
            <button
              onClick={() => setLocation("/profile")}
              className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg btn-animated transition-all hover:scale-[1.05] animate-fade-in"
            >
              <span className="text-white font-bold text-lg">
                {firstName[0]?.toUpperCase() || "?"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="pt-40 px-6 space-y-6">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6 text-center animate-fade-in">
              <button
                onClick={() => setLocation("/chores")}
                className="w-full transition-all btn-animated"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {activeChores.length}
                </p>
                <p className="text-sm text-gray-600">Active chores</p>
              </button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent
              className="p-6 text-center animate-fade-in"
              style={{ animationDelay: "100ms" }}
            >
              <button
                onClick={() => setLocation("/expenses")}
                className="w-full transition-all btn-animated"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${Math.abs(netBalance).toFixed(0)}
                </p>
                <p className="text-sm text-gray-600">
                  {netBalance > 0
                    ? "Owed to you"
                    : netBalance < 0
                      ? "You owe"
                      : "All settled"}
                </p>
              </button>
            </CardContent>
          </Card>

          {/* Additional stats for larger screens */}
          <Card className="glass-card">
            <CardContent
              className="p-6 text-center animate-fade-in"
              style={{ animationDelay: "200ms" }}
            >
              <button
                onClick={() => setLocation("/calendar")}
                className="w-full transition-all btn-animated"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {todayEvents.length}
                </p>
                <p className="text-sm text-gray-600">Today's events</p>
              </button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent
              className="p-6 text-center animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              <button
                onClick={() => setLocation("/messages")}
                className="w-full transition-all btn-animated"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="text-white" size={20} />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {recentMessages.length}
                </p>
                <p className="text-sm text-gray-600">New messages</p>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* AI-Powered Today's Priority */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-primary" />
            Today's Priority
            <span className="ml-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
              AI
            </span>
          </h2>
          <Card className="glass-card border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* AI Analysis */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-2 text-purple-600" />
                    Smart Recommendations
                  </h3>
                  <p className="text-sm text-gray-700">
                    {(() => {
                      const today = new Date();
                      const todayEvents = calendarEvents.filter(
                        (event: any) => {
                          const eventDate = new Date(event.startDate);
                          return (
                            eventDate.toDateString() === today.toDateString()
                          );
                        },
                      );
                      const urgentChores = chores.filter((chore: any) => {
                        if (chore.status === "done" || !chore.dueDate)
                          return false;
                        const dueDate = new Date(chore.dueDate);
                        const diffTime = dueDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(
                          diffTime / (1000 * 60 * 60 * 24),
                        );
                        return diffDays <= 1;
                      });

                      if (todayEvents.length > 0 && urgentChores.length > 0) {
                        return `You have ${todayEvents.length} event${todayEvents.length > 1 ? "s" : ""} and ${urgentChores.length} urgent chore${urgentChores.length > 1 ? "s" : ""} today. Consider completing chores before your events.`;
                      } else if (todayEvents.length > 0) {
                        return `You have ${todayEvents.length} event${todayEvents.length > 1 ? "s" : ""} scheduled today. Perfect time to tackle some chores between activities.`;
                      } else if (urgentChores.length > 0) {
                        return `${urgentChores.length} chore${urgentChores.length > 1 ? "s are" : " is"} due today. Focus on these to stay on track with your household goals.`;
                      } else if (activeChores.length > 0) {
                        return "Great day to get ahead! Consider tackling some pending chores to maintain momentum.";
                      } else {
                        return "You're all caught up! Perfect time to plan ahead or enjoy some well-deserved downtime.";
                      }
                    })()}
                  </p>
                </div>

                {/* Today's Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Today's Events */}
                  <Link href="/calendar">
                    <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                        Today's Events
                      </h4>
                      <div className="space-y-2">
                        {(() => {
                          const today = new Date();
                          const todayEvents = calendarEvents
                            .filter((event: any) => {
                              const eventDate = new Date(event.startDate);
                              return (
                                eventDate.toDateString() === today.toDateString()
                              );
                            })
                            .slice(0, 3);

                          return todayEvents.length > 0 ? (
                            todayEvents.map((event: any) => (
                              <div
                                key={event.id}
                                className="flex items-center space-x-3"
                              >
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: event.color || "#3B82F6",
                                  }}
                                ></div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {event.title}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(event.startDate).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                    )}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-600">
                              No events scheduled
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </Link>

                  {/* Priority Chores */}
                  <Link href="/chores">
                    <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <CheckSquare className="w-4 h-4 mr-2 text-emerald-600" />
                      Priority Chores
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        const today = new Date();
                        const priorityChores = chores
                          .filter((chore: any) => chore.status !== "done")
                          .sort((a: any, b: any) => {
                            const aUrgent = a.dueDate
                              ? new Date(a.dueDate).getTime() - today.getTime()
                              : Infinity;
                            const bUrgent = b.dueDate
                              ? new Date(b.dueDate).getTime() - today.getTime()
                              : Infinity;
                            return aUrgent - bUrgent;
                          })
                          .slice(0, 3);

                        return priorityChores.length > 0 ? (
                          priorityChores.map((chore: any) => (
                            <div
                              key={chore.id}
                              className="flex items-center space-x-3"
                            >
                              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {chore.title}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {chore.dueDate
                                    ? `Due ${new Date(chore.dueDate).toLocaleDateString()}`
                                    : "No due date"}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-600">
                            No pending chores
                          </p>
                        );
                      })()}
                    </div>
                    </div>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-primary" />
              Household Performance
            </h2>
            <button
              onClick={() => setLocation("/dashboard")}
              className="text-sm text-primary font-medium transition-colors hover:text-primary/80"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const completedChores = chores.filter(
                (c: any) => c.status === "done",
              );
              const totalChores = chores.length;
              const completionRate =
                totalChores > 0
                  ? (completedChores.length / totalChores) * 100
                  : 0;

              const memberPerformance =
                household?.members?.map((member: any) => {
                  const memberChores = chores.filter(
                    (c: any) => c.assignedTo === member.userId,
                  );
                  const completedMemberChores = memberChores.filter(
                    (c: any) => c.status === "done",
                  );
                  return {
                    ...member,
                    completionRate:
                      memberChores.length > 0
                        ? (completedMemberChores.length / memberChores.length) *
                          100
                        : 0,
                  };
                }) || [];

              const topPerformer = memberPerformance.sort(
                (a, b) => b.completionRate - a.completionRate,
              )[0];

              return (
                <>
                  <Card className="glass-card">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {completionRate.toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {topPerformer?.user?.firstName || "Team"}
                      </p>
                      <p className="text-sm text-gray-600">Top Performer</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {activeChores.length}
                      </p>
                      <p className="text-sm text-gray-600">Active Tasks</p>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Right Column - Recent Activity */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-primary" />
                Recent Activity
              </h2>
              <button
                onClick={() => setLocation("/messages")}
                className="text-sm text-primary font-medium transition-colors"
              >
                View All
              </button>
            </div>

            {recentMessages.length > 0 ? (
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {recentMessages.map((message: any) => (
                      <div
                        key={message.id}
                        className="flex items-start space-x-3"
                      >
                        <div className="w-10 h-10 bg-ios-gray rounded-2xl flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-sm font-medium">
                            {message.user.firstName?.[0] ||
                              message.user.email?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {message.user.firstName ||
                                message.user.email?.split("@")[0]}
                            </p>
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {message.content}
                          </p>
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
                    onClick={() => setLocation("/messages")}
                    className="w-full text-center border-gray-200 py-8 transition-all"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <MessageCircle size={24} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Start the conversation
                    </h3>
                    <p className="text-gray-600 mb-6">
                      No messages yet. Say hello to your roommates!
                    </p>
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
