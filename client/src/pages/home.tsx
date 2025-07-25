import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
  Users,
  Search,
  Star,
  Plus,
  AlertCircle,
  X,
  Zap,
  Receipt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { getProfileInitials } from "@/lib/nameUtils";
import RoommateListingCard from "@/components/roommate-listing-card";
import { QuickAvatar } from "@/components/ProfileAvatar";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [showKickedNotice, setShowKickedNotice] = useState(false);

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

  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
  });

  // Fetch featured roommate listings for all users
  const { data: featuredListings = [] } = useQuery({
    queryKey: ["/api/roommate-listings", { featured: true }],
    queryFn: () =>
      fetch("/api/roommate-listings?featured=true").then((res) => res.json()),
  });

  const { data: myListings = [] } = useQuery({
    queryKey: ["/api/roommate-listings/my"],
    enabled: !!user, // Fetch when user is logged in
  });

  useEffect(() => {
    // Scroll to top when page loads with timeout for initial load
    window.scrollTo(0, 0);

    // Additional timeout to ensure proper scrolling after onboarding
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 500);

    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };

    // Check if user was kicked from household
    const checkKickedStatus = async () => {
      try {
        const response = await fetch('/api/user/kicked-status');
        if (response.ok) {
          const data = await response.json();
          if (data.wasKicked && !household) {
            setShowKickedNotice(true);
          }
        }
      } catch (error) {
        console.error('Failed to check kicked status:', error);
      }
    };
    
    if (!household) {
      checkKickedStatus();
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [household]);

  // Consolidated variables for both household and non-household users
  const activeChores =
    (chores as any[])?.filter((chore: any) => chore.status !== "done") || [];
  const recentMessages =
    (messages as any[])?.slice().reverse().slice(0, 3) || [];
  const netBalance =
    ((balance as any)?.totalOwed || 0) - ((balance as any)?.totalOwing || 0);
  const firstName =
    (user as any)?.firstName || (user as any)?.email?.split("@")[0] || "there";

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
        ? "Afternoon"
        : "Good evening";

  const nextChore = activeChores.sort((a: any, b: any) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  })[0];

  const todayEvents =
    (calendarEvents as any[])?.filter((event: any) => {
      const eventDate = new Date(event.startDate).toDateString();
      const today = new Date().toDateString();
      return eventDate === today;
    }) || [];

  if (!household) {
    return (
      <div className="page-container page-transition">
        {/* Unified Header */}
        <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
          <div className="page-header">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="page-title">
                  Welcome back, <span className="truncate">{firstName}</span>
                </h1>
                <p className="page-subtitle truncate">
                  Find your perfect living situation
                </p>
              </div>
              <button
                onClick={() => setLocation("/profile")}
                className="flex-shrink-0 shadow-lg btn-animated transition-all hover:scale-[1.05] animate-fade-in"
              >
                <QuickAvatar
                  user={user as any}
                  size="lg"
                  gradientType="emerald"
                  className="rounded"
                />
              </button>
            </div>
          </div>
        </div>

        <div className="content-with-header px-6 space-y-6">
          {/* Kicked Notice */}
          {showKickedNotice && (
            <Card className="glass-card border-orange-200 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                      <AlertCircle size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                        Removed from Household
                      </h4>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        The household administrator has removed you from your previous household. You can join a new household or find roommates below.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      setShowKickedNotice(false);
                      try {
                        await fetch('/api/user/clear-kicked-flag', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        });
                      } catch (error) {
                        console.error('Failed to clear kicked flag:', error);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:scale-110 transition-all"
                    style={{
                      background: 'var(--surface-secondary)',
                      border: 'none'
                    }}
                  >
                    <X size={16} style={{ color: 'var(--text-secondary)' }} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          {(myListings as any[])?.length > 0 && (
            <Card className="glass-card">
              <CardContent className="p-6">
                <h4
                  className="font-semibold mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  Your Activity
                </h4>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {Array.isArray(myListings) ? myListings.length : 0}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Active Listings
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {Array.isArray(featuredListings)
                        ? featuredListings.length
                        : 0}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Available Matches
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* My Activity Section */}
          {(myListings as any[])?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Your Listings
                </h3>
                <button
                  onClick={() => setLocation("/roommates")}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all btn-animated"
                  style={{
                    background: "var(--surface-secondary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span className="text-sm font-medium">View All</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="space-y-4">
                {(myListings as any[]).slice(0, 2).map((listing: any) => (
                  <RoommateListingCard
                    key={listing.id}
                    listing={listing}
                    compact={true}
                    onContact={() => setLocation("/roommates")}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Featured Listings Section */}
          {(myListings as any[])?.length === 0 && (
            <div
              className="space-y-4 pb-6"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Featured Listings
                </h3>
                <button
                  onClick={() => setLocation("/roommates")}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all btn-animated"
                  style={{
                    background: "var(--surface-secondary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span className="text-sm font-medium">View All</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {featuredListings && featuredListings.length > 0 ? (
                <div className="space-y-4">
                  {featuredListings.slice(0, 3).map((listing: any) => (
                    <RoommateListingCard
                      key={listing.id}
                      listing={listing}
                      compact={true}
                      onContact={() => setLocation("/roommates")}
                    />
                  ))}
                </div>
              ) : (
                <Card className="glass-card">
                  <CardContent className="p-8 text-center">
                    <div
                      className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: "var(--surface-secondary)" }}
                    >
                      <Search
                        size={24}
                        style={{ color: "var(--text-secondary)" }}
                      />
                    </div>
                    <h4
                      className="font-medium mb-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      No listings yet
                    </h4>
                    <p
                      className="text-sm mb-4"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Be the first to post a listing in your area
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardContent className="p-6 text-center animate-fade-in">
                <button
                  onClick={() => setLocation("/onboarding")}
                  className="w-full transition-all"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <HomeIcon className="text-white" size={20} />
                  </div>
                  <p
                    className="text-lg font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Create or Join Household
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Start managing shared living
                  </p>
                </button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent
                className="p-6 text-center animate-fade-in"
                style={{ animationDelay: "100ms" }}
              >
                <button
                  onClick={() => setLocation("/roommates")}
                  className="w-full transition-all"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Plus className="text-white" size={20} />
                  </div>
                  <p
                    className="text-lg font-semibold mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Post Your Listing
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Find roommates nearby
                  </p>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container page-transition">
      {/* Unified Header */}
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="page-title">
                {greeting}, <span className="truncate">{firstName}</span>
              </h1>
              <p className="page-subtitle truncate">
                {(household as any)?.name}
              </p>
            </div>
            <button
              onClick={() => setLocation("/profile")}
              className="flex-shrink-0"
            >
              <QuickAvatar
                user={user as any}
                size="lg"
                gradientType="emerald"
                className="shadow-lg btn-animated transition-all hover:scale-[1.05] animate-fade-in rounded-2xl"
              />
            </button>
          </div>
        </div>
      </div>
      <div className="content-with-header px-6 space-y-6">
        {/* Hero Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6 text-center animate-fade-in">
              <button
                onClick={() => setLocation("/chores")}
                className="w-full transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="text-white" size={20} />
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {activeChores.length}
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Active chores
                </p>
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
                className="w-full transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="text-white" size={20} />
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  ${Math.abs(netBalance).toFixed(2)}
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
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
                className="w-full transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="text-white" size={20} />
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {todayEvents.length}
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Today's events
                </p>
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
                className="w-full transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="text-white" size={20} />
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {recentMessages.length}
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  New messages
                </p>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        {(myListings as any[])?.length > 0 && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <h4
                className="font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Your Activity
              </h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {Array.isArray(myListings) ? myListings.length : 0}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Active Listings
                  </p>
                </div>
                <div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {Array.isArray(featuredListings)
                      ? featuredListings.length
                      : 0}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Available Matches
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI-Powered Today's Priority */}
        <div className="mb-8">
          <h2
            className="text-xl font-bold mb-4 flex items-center"
            style={{ color: "var(--text-primary)" }}
          >
            <Target className="w-5 h-5 mr-2 text-primary" />
            Today's Priority
            <span className="ml-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
              AI
            </span>
          </h2>
          <Card className="glass-card border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* AI Analysis */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--surface-overlay)" }}
                >
                  <h3
                    className="font-semibold mb-2 flex items-center"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <Brain className="w-4 h-4 mr-2 text-purple-600" />
                    Smart Recommendations
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {(() => {
                      const today = new Date();
                      const todayEvents =
                        (calendarEvents as any[])?.filter((event: any) => {
                          const eventDate = new Date(event.startDate);
                          return (
                            eventDate.toDateString() === today.toDateString()
                          );
                        }) || [];
                      const urgentChores = (chores as any[])?.filter(
                        (chore: any) => {
                          if (chore.status === "done" || !chore.dueDate)
                            return false;
                          const dueDate = new Date(chore.dueDate);
                          const diffTime = dueDate.getTime() - today.getTime();
                          const diffDays = Math.ceil(
                            diffTime / (1000 * 60 * 60 * 24),
                          );
                          return diffDays <= 1;
                        },
                      );

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
                  <button
                    onClick={() => setLocation("/calendar")}
                    className="rounded-xl p-4 w-full text-left transition-colors btn-animated"
                    style={{
                      background: "var(--surface-secondary)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <h4
                      className="font-semibold mb-3 flex items-center"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                      Today's Events
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        const today = new Date();
                        const todayEvents = (calendarEvents as any[])
                          ?.filter((event: any) => {
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
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {event.title}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {new Date(event.startDate).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            No events scheduled
                          </p>
                        );
                      })()}
                    </div>
                  </button>

                  {/* Priority Chores */}
                  <button
                    onClick={() => setLocation("/chores")}
                    className="rounded-xl p-4 w-full text-left transition-colors btn-animated"
                    style={{
                      background: "var(--surface-secondary)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <h4
                      className="font-semibold mb-3 flex items-center"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <CheckSquare className="w-4 h-4 mr-2 text-emerald-600" />
                      Priority Chores
                    </h4>
                    <div className="space-y-2">
                      {(() => {
                        const today = new Date();
                        const priorityChores = (chores as any[])
                          ?.filter((chore: any) => chore.status !== "done")
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
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {chore.title}
                                </p>
                                <p
                                  className="text-xs"
                                  style={{ color: "var(--text-secondary)" }}
                                >
                                  {chore.dueDate
                                    ? `Due ${new Date(chore.dueDate).toLocaleDateString()}`
                                    : "No due date"}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            No pending chores
                          </p>
                        );
                      })()}
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Household Insights */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                className="text-xl font-bold flex items-center"
                style={{ color: "var(--text-primary)" }}
              >
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                Household Insights
                <span className="ml-2 px-2 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs rounded-full">
                  Live
                </span>
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Real-time analytics for your household
              </p>
            </div>
            <button
              onClick={() => setLocation("/dashboard")}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all btn-animated"
              style={{
                background: "var(--surface-secondary)",
                color: "var(--text-secondary)",
              }}
            >
              <span className="text-sm font-medium">View All</span>
              <ArrowRight size={14} />
            </button>
          </div>
          {(chores as any[])?.length === 0 &&
          (!balance ||
            ((balance as any).totalOwed === 0 &&
              (balance as any).totalOwing === 0)) ? (
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 size={24} className="text-white" />
                  </div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    No activity yet
                  </h3>
                  <p
                    className="mb-6"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Start tracking chores and expenses to see your household
                    insights!
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setLocation("/chores")}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium text-sm transition-all hover:scale-[1.02]"
                    >
                      Add Chore
                    </button>
                    <button
                      onClick={() => setLocation("/expenses")}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 text-white font-medium text-sm transition-all hover:scale-[1.02]"
                    >
                      Add Expense
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Primary Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(() => {
                  const completedChores =
                    (chores as any[])?.filter((c: any) => c.status === "done") ||
                    [];
                  const totalChores = (chores as any[])?.length || 0;
                  const completionRate =
                    totalChores > 0
                      ? (completedChores.length / totalChores) * 100
                      : 0;

                  // Calculate weekly trend
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  const recentCompletions = completedChores.filter((c: any) => 
                    c.completedAt && new Date(c.completedAt) > weekAgo
                  ).length;

                  // Active chores
                  const activeChores = (chores as any[])?.filter(
                    (c: any) => c.status !== "done"
                  ) || [];
                  
                  // Urgent chores (due within 24 hours)
                  const urgentChores = activeChores.filter((chore: any) => {
                    if (!chore.dueDate) return false;
                    const dueDate = new Date(chore.dueDate);
                    const now = new Date();
                    const diffTime = dueDate.getTime() - now.getTime();
                    const diffHours = diffTime / (1000 * 60 * 60);
                    return diffHours <= 24 && diffHours >= 0;
                  });

                  const memberPerformance =
                    (household as any)?.members?.map((member: any) => {
                      const memberChores =
                        (chores as any[])?.filter(
                          (c: any) => c.assignedTo === member.userId,
                        ) || [];
                      const completedMemberChores = memberChores.filter(
                        (c: any) => c.status === "done",
                      );
                      return {
                        ...member,
                        totalChores: memberChores.length,
                        completedChores: completedMemberChores.length,
                        completionRate:
                          memberChores.length > 0
                            ? (completedMemberChores.length /
                                memberChores.length) *
                              100
                            : 0,
                      };
                    }) || [];

                  const topPerformer = memberPerformance.sort(
                    (a: any, b: any) => b.completionRate - a.completionRate,
                  )[0];

                  return (
                    <>
                      <Card className="glass-card overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full" style={{
                              background: completionRate >= 80 ? 'rgba(34, 197, 94, 0.1)' : 
                                        completionRate >= 50 ? 'rgba(251, 191, 36, 0.1)' :
                                        'rgba(239, 68, 68, 0.1)',
                              color: completionRate >= 80 ? '#22c55e' : 
                                     completionRate >= 50 ? '#fbbf24' :
                                     '#ef4444'
                            }}>
                              {completionRate >= 80 ? 'Excellent' : 
                               completionRate >= 50 ? 'Good' : 'Needs Work'}
                            </span>
                          </div>
                          <p
                            className="text-3xl font-bold mb-1"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {completionRate.toFixed(0)}%
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Completion Rate
                          </p>
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              {recentCompletions} tasks this week
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-card overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                              <Award className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                {topPerformer?.completionRate?.toFixed(0) || 0}%
                              </span>
                            </div>
                          </div>
                          <p
                            className="text-xl font-bold mb-1 truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {topPerformer?.user?.firstName || "Team"}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Top Performer
                          </p>
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              {topPerformer?.completedChores || 0} of {topPerformer?.totalChores || 0} tasks
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-card overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full" style={{
                              background: 'rgba(168, 85, 247, 0.1)',
                              color: '#a855f7'
                            }}>
                              Balance
                            </span>
                          </div>
                          <p
                            className="text-2xl font-bold mb-1"
                            style={{ color: "var(--text-primary)" }}
                          >
                            ${Math.abs(netBalance).toFixed(0)}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {netBalance > 0 ? "Owed to you" : netBalance < 0 ? "You owe" : "All settled"}
                          </p>
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              Track expenses
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-card overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                              <CheckSquare className="w-5 h-5 text-white" />
                            </div>
                            <Zap className="w-4 h-4" style={{ color: '#fbbf24' }} />
                          </div>
                          <p
                            className="text-3xl font-bold mb-1"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {activeChores.length}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Active Tasks
                          </p>
                          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                              {urgentChores.length} urgent
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>

              {/* Member Performance Chart */}
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center" style={{ color: "var(--text-primary)" }}>
                    <Users className="w-4 h-4 mr-2" />
                    Member Performance
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const memberPerformance =
                        (household as any)?.members?.map((member: any) => {
                          const memberChores =
                            (chores as any[])?.filter(
                              (c: any) => c.assignedTo === member.userId,
                            ) || [];
                          const completedMemberChores = memberChores.filter(
                            (c: any) => c.status === "done",
                          );
                          return {
                            ...member,
                            completionRate:
                              memberChores.length > 0
                                ? (completedMemberChores.length /
                                    memberChores.length) *
                                  100
                                : 0,
                            totalChores: memberChores.length,
                            completedChores: completedMemberChores.length,
                          };
                        }) || [];

                      return memberPerformance.map((member: any) => (
                        <div key={member.userId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                {member.user?.firstName?.[0] || '?'}
                              </div>
                              <div>
                                <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                                  {member.user?.firstName || 'Unknown'}
                                </p>
                                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                  {member.completedChores} of {member.totalChores} tasks completed
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                              {member.completionRate.toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-secondary)" }}>
                            <div 
                              className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 transition-all duration-500"
                              style={{ width: `${member.completionRate}%` }}
                            />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <button
                      onClick={() => setLocation("/dashboard")}
                      className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.02]"
                      style={{ background: "var(--surface-secondary)" }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                            View Full Dashboard
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            Detailed analytics & trends
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={16} style={{ color: "var(--text-secondary)" }} />
                    </button>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardContent className="p-4">
                    <button
                      onClick={() => setLocation("/expenses")}
                      className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.02]"
                      style={{ background: "var(--surface-secondary)" }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                          <Receipt className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium" style={{ color: "var(--text-primary)" }}>
                            Expense History
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            Track spending patterns
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={16} style={{ color: "var(--text-secondary)" }} />
                    </button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Roommate Marketplace Section */}
        <div
          className="mt-12 border-t pt-8"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2
                  className="font-semibold text-[22px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  Find Roommates
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Discover your roommate match
                </p>
              </div>
            </div>
            <button
              onClick={() => setLocation("/roommates")}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all btn-animated"
              style={{
                background: "var(--surface-secondary)",
                color: "var(--text-secondary)",
              }}
            >
              <span className="text-sm font-medium">View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {featuredListings.length > 0 ? (
            <div className="space-y-4 mb-6">
              {featuredListings.slice(0, 3).map((listing: any) => (
                <RoommateListingCard
                  key={listing.id}
                  listing={listing}
                  compact={true}
                  onContact={(listing) => {
                    if (listing.contactInfo) {
                      window.open(`mailto:${listing.contactInfo}`, "_blank");
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  No listings yet
                </h3>
                <p className="mb-4" style={{ color: "var(--text-secondary)" }}>
                  Be the first to post a roommate listing in your area
                </p>
                <button
                  onClick={() => setLocation("/roommates")}
                  className="px-6 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl font-semibold transition-all hover:scale-[1.02] btn-animated"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Post Listing
                </button>
              </CardContent>
            </Card>
          )}

          {featuredListings.length > 3 && (
            <div className="text-center">
              <button
                onClick={() => setLocation("/roommates")}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl transition-all btn-animated"
                style={{
                  background: "var(--surface-secondary)",
                  color: "var(--text-secondary)",
                }}
              >
                <span className="text-sm font-medium">View All</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
