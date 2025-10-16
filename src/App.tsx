"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "react-hot-toast";

import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Costs from "@/pages/Costs";
import Profits from "@/pages/Profits";
import Partners from "@/pages/Partners";
import PartnerDetails from "@/pages/PartnerDetails";
import Login from "@/pages/Login"; // Import the new Login page
import Index from "@/pages/Index"; // Import the original Index page

import { PartnersProvider } from "@/context/PartnersContext";
import { CostsProvider } from "@/context/CostsContext";
import { ProfitsProvider } from "@/context/ProfitsContext";
import { SupabaseProvider, useSupabase } from "@/context/SupabaseContext"; // Import SupabaseProvider and useSupabase

// A wrapper component to handle loading and redirection based on auth state
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, session } = useSupabase();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Carregando...</h1>
          <p className="text-xl text-gray-600">Verificando sessão de usuário.</p>
        </div>
      </div>
    );
  }

  // If not loading and no session, the SupabaseProvider will handle navigation to /login
  // If there's a session, render children
  return <>{children}</>;
};

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router>
        <SupabaseProvider>
          <AuthWrapper>
            <PartnersProvider>
              <CostsProvider>
                <ProfitsProvider>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Index />} /> {/* Keep Index as the default landing */}
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="costs" element={<Costs />} />
                      <Route path="profits" element={<Profits />} />
                      <Route path="partners" element={<Partners />} />
                      <Route path="partners/:id" element={<PartnerDetails />} />
                    </Route>
                  </Routes>
                </ProfitsProvider>
              </CostsProvider>
            </PartnersProvider>
          </AuthWrapper>
        </SupabaseProvider>
      </Router>
    </TooltipProvider>
  );
}

export default App;