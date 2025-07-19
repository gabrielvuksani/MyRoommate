import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  DollarSign,
  MessageCircle,
  Home,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useEffect } from "react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/auth";
  };

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      icon: CheckCircle,
      title: "Smart Chores",
      description:
        "Automated task rotation with streak tracking and gamification",
      gradient: "from-emerald-400 to-cyan-400",
    },
    {
      icon: DollarSign,
      title: "Split Expenses",
      description: "Instant bill splitting with real-time balance tracking",
      gradient: "from-blue-400 to-purple-400",
    },
    {
      icon: MessageCircle,
      title: "Group Chat",
      description:
        "Real-time messaging with typing indicators and quick reactions",
      gradient: "from-pink-400 to-rose-400",
    },
    {
      icon: Calendar,
      title: "Shared Calendar",
      description: "Coordinate events, movie nights, and household activities",
      gradient: "from-orange-400 to-amber-400",
    },
    {
      icon: Users,
      title: "Household Management",
      description: "Invite codes, member roles, and performance analytics",
      gradient: "from-violet-400 to-indigo-400",
    },
    {
      icon: Home,
      title: "One Platform",
      description: "Everything you need for seamless shared living in one app",
      gradient: "from-teal-400 to-green-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 dark:from-blue-600/10 dark:to-purple-600/10"></div>

        <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/25">
              <Home size={32} className="text-white" />
            </div>
            <h1 className="font-bold text-[#1a1a1a] dark:text-white text-[32px] leading-tight mb-4">
              myRoommate
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
              Transform shared living into a seamless, intelligent experience.
              One app that removes every roommate headache.
            </p>
          </div>

          {/* Main CTA */}
          <Button
            onClick={handleLogin}
            className="w-full max-w-sm mx-auto h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-2xl shadow-xl shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] mb-12"
          >
            <Sparkles size={20} className="mr-2" />
            Get Started Free
          </Button>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span>Free to use</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>No credit card</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Setup in 2 mins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <h2 className="font-semibold text-[#1a1a1a] dark:text-white text-[24px] mb-4">
            Everything you need for perfect roommate harmony
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Inspired by the best productivity and lifestyle apps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={index}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 rounded-3xl shadow-2xl shadow-gray-200/50 dark:shadow-slate-900/50 hover:scale-[1.02] transition-all duration-200 group"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg`}
                  >
                    <IconComponent size={20} className="text-white" />
                  </div>
                  <h3 className="font-semibold text-[#1a1a1a] dark:text-white text-[18px] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-t border-white/20 dark:border-slate-700/20">
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <h3 className="font-semibold text-[#1a1a1a] dark:text-white text-[20px] mb-3">
            Ready to transform your living experience?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of happy roommates who've simplified their shared
            living
          </p>
          <Button
            onClick={handleLogin}
            className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02]"
          >
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
}
