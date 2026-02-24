import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import QuoteDetail from "@/pages/quote-detail";
import Submit from "@/pages/submit";
import Admin from "@/pages/admin";
import Auth from "@/pages/auth";
import Waitlist from "@/pages/waitlist";
import Profile from "@/pages/profile";
import Withdraw from "@/pages/withdraw";
import Topup from "@/pages/topup";
import QuoteMaker from "@/pages/quote-maker";
import Trending from "@/pages/trending";
import AuthorPage from "@/pages/author";
import Layout from "@/components/layout";
import { AuthProvider, useAuth } from "@/lib/auth";
import { SettingsProvider } from "@/lib/settings";
import MaintenanceScreen from "@/components/maintenance-screen";
import { useSettings } from "@/lib/settings";
import SiteNotification from "@/components/site-notification";

function AppContent() {
  const settings = useSettings();
  const { user } = useAuth();

  if (settings.maintenanceMode && user?.role !== "admin") {
    return <MaintenanceScreen />;
  }

  return (
    <>
      <SiteNotification />
      <Layout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/explore" component={Explore} />
          <Route path="/q/:id" component={QuoteDetail} />
          <Route path="/submit" component={Submit} />
          <Route path="/maker" component={QuoteMaker} />
          <Route path="/trending" component={Trending} />
          <Route path="/author/:name" component={AuthorPage} />
          <Route path="/admin" component={Admin} />
          <Route path="/auth" component={Auth} />
          <Route path="/waitlist" component={Waitlist} />
          <Route path="/profile" component={Profile} />
          <Route path="/withdraw" component={Withdraw} />
          <Route path="/topup" component={Topup} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <SettingsProvider>
            <Toaster />
            <AppContent />
          </SettingsProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
