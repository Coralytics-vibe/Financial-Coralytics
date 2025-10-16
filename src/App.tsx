"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "react-hot-toast"; // This package will be installed

import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Costs from "@/pages/Costs";
import Profits from "@/pages/Profits";
import Partners from "@/pages/Partners";

import { PartnersProvider } from "@/context/PartnersContext";
import { CostsProvider } from "@/context/CostsContext";
import { ProfitsProvider } from "@/context/ProfitsContext";

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <PartnersProvider>
        <CostsProvider>
          <ProfitsProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="costs" element={<Costs />} />
                  <Route path="profits" element={<Profits />} />
                  <Route path="partners" element={<Partners />} />
                </Route>
              </Routes>
            </Router>
          </ProfitsProvider>
        </CostsProvider>
      </PartnersProvider>
    </TooltipProvider>
  );
}

export default App;