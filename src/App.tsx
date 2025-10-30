"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Costs from "@/pages/Costs";
import Profits from "@/pages/Profits";
import Partners from "@/pages/Partners";
import PartnerDetails from "@/pages/PartnerDetails";

import { PartnersProvider } from "@/context/PartnersContext";
import { CostsProvider } from "@/context/CostsContext";
import { ProfitsProvider } from "@/context/ProfitsContext";

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router>
        <PartnersProvider>
          <CostsProvider>
            <ProfitsProvider>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} /> {/* Dashboard agora é a página inicial */}
                  <Route path="dashboard" element={<Dashboard />} /> {/* Mantém a rota explícita também */}
                  <Route path="costs" element={<Costs />} />
                  <Route path="profits" element={<Profits />} />
                  <Route path="partners" element={<Partners />} />
                  <Route path="partners/:id" element={<PartnerDetails />} />
                </Route>
              </Routes>
            </ProfitsProvider>
          </CostsProvider>
        </PartnersProvider>
      </Router>
    </TooltipProvider>
  );
}

export default App;