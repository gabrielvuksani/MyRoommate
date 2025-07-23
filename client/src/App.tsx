import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { AuthProvider, useAuth } from "@/hooks/use-supabase-auth";
import Landing from "@/pages/landing";
import { useQuery } from "@tanstack/react-query";
import { getUserFlags } from "@/lib/userUtils";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { PersistentLoading } from "@/lib/persistentLoading";
import { shouldSkipLanding } from "@/lib/pwaUtils";
import { AuthTransition } from "@/lib/authTransition";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Home from "@/pages/home";
import Chores from "@/pages/chores";
import Expenses from "@/pages/expenses";
import Calendar from "@/pages/calendar";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Roommates from "@/pages/roommates";
import ListingDetail from "@/pages/listing-detail";
import AddListing from "@/pages/add-listing";
import AddExpense from "@/pages/add-expense";
import BottomNavigation from "@/components/bottom-navigation";

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const { isKeyboardVisible } = useKeyboardHeight();

  // Check for persistent loading on page load
  useEffect(() => {
    PersistentLoading.checkAndShow();
    // Clear auth transition and loading when component mounts with a user
    if (user && AuthTransition.isInProgress()) {
      AuthTransition.clear();
      // Hide loading after a short delay to ensure smooth transition
      setTimeout(() => {
        PersistentLoading.hide();
      }, 500);
    }
  }, [user]);
  
  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
    enabled: !!user,
  }) as { data: any };

  // Show loading state during auth transition or initial load
  if (isLoading || AuthTransition.isInProgress()) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Get comprehensive user flags using centralized logic
  // For Supabase, we need to adapt the user object structure
  const adaptedUser = user ? {
    id: user.id,
    firstName: user.user_metadata?.firstName || '',
    lastName: user.user_metadata?.lastName || '',
    email: user.email || '',
    profileColor: user.user_metadata?.profileColor || 'blue',
    profileImageUrl: user.user_metadata?.profileImageUrl || null
  } : null;
  
  const userFlags = getUserFlags(adaptedUser, household, !!user, location);
  const { needsOnboarding, hasHousehold } = userFlags;
  
  // Check if we should skip landing page for PWA/native apps
  const skipLanding = shouldSkipLanding();

  return (
    <div className="max-w-md mx-auto min-h-screen relative" style={{ background: 'var(--background)' }}>
      <Switch>
        {!user ? (
          <>
            <Route path="/landing" component={Landing} />
            <Route path="/auth" component={AuthPage} />
            <Route path="/" component={skipLanding ? AuthPage : Landing} />
          </>
        ) : needsOnboarding ? (
          <>
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/roommates" component={Roommates} />
            <Route path="/listings/:id" component={ListingDetail} />
            <Route path="/" component={Onboarding} />
          </>
        ) : (
          <>
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/" component={Home} />
            <Route path="/chores" component={hasHousehold ? Chores : Home} />
            <Route path="/expenses" component={hasHousehold ? Expenses : Home} />
            <Route path="/calendar" component={hasHousehold ? Calendar : Home} />
            <Route path="/messages" component={hasHousehold ? Messages : Home} />
    
            <Route path="/profile" component={Profile} />
            <Route path="/settings" component={Profile} />
            <Route path="/dashboard" component={hasHousehold ? Dashboard : Home} />

            <Route path="/roommates" component={Roommates} />
            <Route path="/listings/:id" component={ListingDetail} />
            <Route path="/add-listing" component={AddListing} />
            <Route path="/add-expense" component={hasHousehold ? AddExpense : Home} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {/* Navigation - Only show for users with households */}
      {user && hasHousehold && !needsOnboarding && !isKeyboardVisible && (
        <BottomNavigation />
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
