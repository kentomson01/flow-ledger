import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageTransition } from "@/components/PageTransition";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayoutRoute } from "@/components/layout/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import ConnectPage from "./pages/ConnectPage";
import Dashboard from "./pages/Dashboard";
import OrganizationPage from "./pages/OrganizationPage";
import TeamPage from "./pages/TeamPage";
import PayrollListPage from "./pages/PayrollListPage";
import NewPayrollPage from "./pages/NewPayrollPage";
import PayrollDetailPage from "./pages/PayrollDetailPage";
import HistoryPage from "./pages/HistoryPage";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import FreelancerPayments from "./pages/FreelancerPayments";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
      <Route path="/connect" element={<PageTransition><ConnectPage /></PageTransition>} />

      <Route element={<ProtectedRoute><DashboardLayoutRoute /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/organization" element={<OrganizationPage />} />
        <Route path="/dashboard/team" element={<TeamPage />} />
        <Route path="/dashboard/payroll" element={<PayrollListPage />} />
        <Route path="/dashboard/payroll/new" element={<NewPayrollPage />} />
        <Route path="/dashboard/payroll/:id" element={<PayrollDetailPage />} />
        <Route path="/dashboard/history" element={<HistoryPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
      </Route>

      <Route element={<ProtectedRoute><DashboardLayoutRoute /></ProtectedRoute>}>
        <Route path="/freelancer" element={<FreelancerDashboard />} />
        <Route path="/freelancer/payments" element={<FreelancerPayments />} />
      </Route>

      <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
