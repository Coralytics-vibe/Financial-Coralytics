"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Removido 'Navigate'
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Costs from "@/pages/Costs";
import Profits from "@/pages/Profits";
import Partners from "@/pages/Partners";
import PartnerDetails from "@/pages/PartnerDetails";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";

import { PartnersProvider } from "@/context/PartnersContext";
import { CostsProvider } from "@/context/CostsContext";
import { ProfitsProvider } from "@/context/ProfitsContext";
// Removido SessionContextProvider e useSession

// Removido ProtectedRoute

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router>
        {/* SessionContextProvider removido temporariamente */}
        <AppRoutes />
      </Router>
    </TooltipProvider>
  );
}

// Componente separado para as rotas
const AppRoutes: React.FC = () => {
  return (
    <PartnersProvider>
      <CostsProvider>
        <ProfitsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Rotas agora acessíveis diretamente sem proteção */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="costs" element={<Costs />} />
              <Route path="profits" element={<Profits />} />
              <Route path="partners" element={<Partners />} />
              <Route path="partners/:id" element={<PartnerDetails />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ProfitsProvider>
      </CostsProvider>
    </PartnersProvider>
  );
};

export default App;