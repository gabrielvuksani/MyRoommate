import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getUserFlags } from "@/lib/userUtils";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
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
import BottomNavigation from "@/components/bottom-navigation";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
  }) as { data: any };
  
  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
    enabled: isAuthenticated,
  }) as { data: any };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Get centralized user flags for consistent differentiation
  const userFlags = getUserFlags(user, household, isAuthenticated);
  const { isNewUser, isExistingUser, needsOnboarding, hasNoHousehold, isFullyOnboarded } = userFlags;

  return (
    <div className="max-w-md mx-auto min-h-screen relative" style={{ background: 'var(--background)' }}>
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : needsOnboarding ? (
          <>
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/" component={Onboarding} />
          </>
        ) : (
          <>
            <Route path="/onboarding" component={Onboarding} />
            <Route path="/" component={Home} />
            <Route path="/chores" component={Chores} />
            <Route path="/expenses" component={Expenses} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/messages" component={Messages} />
    
            <Route path="/profile" component={Profile} />
            <Route path="/settings" component={Profile} />
            <Route path="/dashboard" component={Dashboard} />

            <Route path="/roommates" component={Roommates} />
            <Route path="/listings/:id" component={ListingDetail} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {isAuthenticated && household && <BottomNavigation />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
