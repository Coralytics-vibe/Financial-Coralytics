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
import Login from "@/pages/Login"; // Importar a página de Login
import NotFound from "@/pages/NotFound";

import { PartnersProvider } from "@/context/PartnersContext";
import { CostsProvider } from "@/context/CostsContext";
import { ProfitsProvider } from "@/context/ProfitsContext";
import { SessionContextProvider, useSession } from "@/context/SessionContext"; // Importar SessionContextProvider e useSession
import { MadeWithDyad } from "./components/made-with-dyad";
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "./integrations/supabase/client";
import { showError } from "./utils/toast";

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router>
        <SessionContextProvider> {/* Envolver tudo com SessionContextProvider */}
          <AppRoutes />
        </SessionContextProvider>
      </Router>
    </TooltipProvider>
  );
}

const AppRoutes: React.FC = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">Carregando autenticação...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Erro ao fazer logout: " + error.message);
    }
  };

  return (
    <>
      {session && (
        <div className="absolute top-4 right-4 z-50">
          <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<Login />} />
        {session ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="costs" element={<Costs />} />
            <Route path="profits" element={<Profits />} />
            <Route path="partners" element={<Partners />} />
            <Route path="partners/:id" element={<PartnerDetails />} />
          </Route>
        ) : (
          // Redireciona qualquer rota protegida para o login se não houver sessão
          <Route path="*" element={<Login />} />
        )}
        <Route path="*" element={<NotFound />} /> {/* Catch-all para rotas não encontradas, incluindo as protegidas */}
      </Routes>
      {!session && <MadeWithDyad />} {/* Mostrar MadeWithDyad apenas na tela de login */}
    </>
  );
};

export default App;