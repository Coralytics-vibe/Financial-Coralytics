"use client";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Costs from "@/pages/Costs";
import Profits from "@/pages/Profits";
import Partners from "@/pages/Partners";
import PartnerDetails from "@/pages/PartnerDetails";
import NotFound from "@/pages/NotFound"; // Import NotFound page
import Login from "@/pages/Login"; // Import Login page

import { PartnersProvider } from "@/context/PartnersContext";
import { CostsProvider } from "@/context/CostsContext";
import { ProfitsProvider } from "@/context/ProfitsContext";
import { SessionContextProvider, useSession } from "@/context/SessionContext"; // Import SessionContextProvider and useSession

// ProtectedRoute component to guard routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useSession();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>; // Or a spinner component
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router>
        <SessionContextProvider>
          <AppRoutes />
        </SessionContextProvider>
      </Router>
    </TooltipProvider>
  );
}

// Separate component for routes to use useSession hook
const AppRoutes: React.FC = () => {
  return (
    <PartnersProvider>
      <CostsProvider>
        <ProfitsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="costs" element={<Costs />} />
              <Route path="profits" element={<Profits />} />
              <Route path="partners" element={<Partners />} />
              <Route path="partners/:id" element={<PartnerDetails />} />
            </Route>
            <Route path="*" element={<NotFound />} /> {/* Catch-all for 404 */}
          </Routes>
        </ProfitsProvider>
      </CostsProvider>
    </PartnersProvider>
  );
};

export default App;