"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { showSuccess, showError } from "@/utils/toast";

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setIsLoading(false);

      if (event === 'SIGNED_IN' && currentSession) {
        showSuccess("Login realizado com sucesso!");
        if (location.pathname === '/login') {
          navigate('/dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        showSuccess("Logout realizado com sucesso!");
        navigate('/login');
      } else if (event === 'INITIAL_SESSION' && !currentSession) {
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
    });

    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsLoading(false);
      if (!initialSession && location.pathname !== '/login') {
        navigate('/login');
      } else if (initialSession && location.pathname === '/login') {
        navigate('/dashboard');
      }
    }).catch((error) => {
      console.error("Error fetching initial session:", error);
      showError("Erro ao carregar a sessão inicial.");
      setIsLoading(false);
      if (location.pathname !== '/login') {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return (
    <SessionContext.Provider value={{ session, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
};