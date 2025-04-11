
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CompanyProvider } from "./contexts/CompanyContext";
import { ActionProvider } from "./contexts/ActionContext";
import AuthLayout from "./layouts/AuthLayout";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ActionsPage from "./pages/ActionsPage";
import ClientsPage from "./pages/ClientsPage";
import ResponsiblesPage from "./pages/ResponsiblesPage";
import CompanyPage from "./pages/CompanyPage";
import { useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CompanyProvider>
          <ActionProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                <Route path="/dashboard" element={
                  <AuthLayout>
                    <DashboardPage />
                  </AuthLayout>
                } />
                
                <Route path="/actions" element={
                  <AuthLayout>
                    <ActionsPage />
                  </AuthLayout>
                } />
                
                <Route path="/clients" element={
                  <AuthLayout>
                    <ClientsPage />
                  </AuthLayout>
                } />
                
                <Route path="/responsibles" element={
                  <AuthLayout>
                    <ResponsiblesPage />
                  </AuthLayout>
                } />
                
                <Route path="/company" element={
                  <AuthLayout>
                    <CompanyPage />
                  </AuthLayout>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
            <Sonner />
          </ActionProvider>
        </CompanyProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
