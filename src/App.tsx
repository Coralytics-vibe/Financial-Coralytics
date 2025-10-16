import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Partners from "./pages/Partners";
import Costs from "./pages/Costs";
import Profits from "./pages/Profits";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { PartnersProvider } from "./context/PartnersContext";
import { CostsProvider } from "./context/CostsContext";     // Import CostsProvider
import { ProfitsProvider } from "./context/ProfitsContext"; // Import ProfitsProvider

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PartnersProvider>
          <CostsProvider>     {/* Wrap with CostsProvider */}
            <ProfitsProvider> {/* Wrap with ProfitsProvider */}
              <Layout>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/partners" element={<Partners />} />
                  <Route path="/costs" element={<Costs />} />
                  <Route path="/profits" element={<Profits />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProfitsProvider>
          </CostsProvider>
        </PartnersProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;