import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getUserFlags } from "@/lib/userUtils";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { PersistentLoading } from "@/lib/persistentLoading";
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
import AddExpense from "@/pages/add-expense";
import BottomNavigation from "@/components/bottom-navigation";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const { isKeyboardVisible } = useKeyboardHeight();

  // Check for persistent loading on page load
  useEffect(() => {
    PersistentLoading.checkAndShow();
  }, []);
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

  // Get comprehensive user flags using centralized logic
  const userFlags = getUserFlags(user, household, isAuthenticated, location);
  const { needsOnboarding, hasHousehold } = userFlags;

  return (
    <div className="max-w-md mx-auto min-h-screen relative" style={{ background: 'var(--background)' }}>
      <Switch>
        {!isAuthenticated ? (
          <>
            <Route path="/landing" component={Landing} />
            <Route path="/" component={Landing} />
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
            <Route path="/add-expense" component={hasHousehold ? AddExpense : Home} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      
      {isAuthenticated && hasHousehold && !needsOnboarding && location !== '/onboarding' && !isKeyboardVisible && <BottomNavigation />}
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
