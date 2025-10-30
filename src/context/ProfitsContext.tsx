"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { Profit, ProfitDistribution, Partner } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { usePartners } from "./PartnersContext";
// import { useLocalStorage } from "@/hooks/use-local-storage"; // Not needed after migrating to Supabase
import { uploadDocument, deleteDocument } from "@/integrations/supabase/storage";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProfitsContextType {
  profits: Profit[];
  addProfit: (date: Date, value: number, source: string, category: Profit['category'], documentFile: File | null) => Promise<void>;
  editProfit: (id: string, date: Date, value: number, source: string, category: Profit['category'], documentFile: File | null, currentDocumentUrl: string | undefined, removeExistingDocument: boolean) => Promise<void>;
  deleteProfit: (id: string) => Promise<void>;
  isLoadingProfits: boolean; // New: Loading state for profits
}

const ProfitsContext = createContext<ProfitsContextType | undefined>(undefined);

export const ProfitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profits, setProfits] = useState<Profit[]>([]);
  const [isLoadingProfits, setIsLoadingProfits] = useState(true);
  const { partners, updatePartnerBalance, isLoadingPartners } = usePartners();
  const { session, isLoading: isLoadingAuth } = useAuth();
  const userId = session?.user?.id;

  const fetchProfits = useCallback(async () => {
    if (!userId) {
      setProfits([]);
      setIsLoadingProfits(false);
      return;
    }
    setIsLoadingProfits(true);
    const { data, error } = await supabase
      .from('profits')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching profits:", error);
      showError("Erro ao carregar lucros.");
      setProfits([]);
    } else {
      // Convert date strings back to Date objects
      const fetchedProfits: Profit[] = data.map(profit => ({
        ...profit,
        date: new Date(profit.date),
      }));
      setProfits(fetchedProfits || []);
    }
    setIsLoadingProfits(false);
  }, [userId]);

  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPartners) {
      fetchProfits();
    }
  }, [isLoadingAuth, isLoadingPartners, fetchProfits]);

  const addProfit = useCallback(
    async (date: Date, value: number, source: string, category: Profit['category'], documentFile: File | null) => {
      if (!userId) {
        showError("Usuário não autenticado. Não é possível adicionar lucros.");
        return;
      }
      if (partners.length === 0) {
        showError("Adicione sócios antes de registrar lucros.");
        return;
      }

      let documentUrl: string | undefined;
      if (documentFile) {
        const uploadedUrl = await uploadDocument(userId, documentFile);
        if (uploadedUrl) {
          documentUrl = uploadedUrl;
        } else {
          showError("Falha ao fazer upload do documento.");
          return;
        }
      }

      const distributions: ProfitDistribution[] = partners.map((partner: Partner) => {
        const amount = (value * partner.participation) / 100;
        return {
          partnerId: partner.id,
          amount: amount,
        };
      });

      const newProfitData = {
        user_id: userId,
        date,
        value,
        source,
        category,
        distributions, // Stored as JSONB
        document_url: documentUrl,
      };

      const { data, error } = await supabase
        .from('profits')
        .insert(newProfitData)
        .select()
        .single();

      if (error) {
        console.error("Error adding profit:", error);
        showError("Erro ao registrar lucro.");
      } else if (data) {
        const addedProfit: Profit = { ...data, date: new Date(data.date) };
        setProfits((prev) => [...prev, addedProfit]);
        for (const dist of addedProfit.distributions) {
          await updatePartnerBalance(dist.partnerId, dist.amount);
        }
        showSuccess("Lucro registrado e distribuído com sucesso!");
      }
    },
    [partners, updatePartnerBalance, userId, setProfits]
  );

  const editProfit = useCallback(
    async (id: string, date: Date, value: number, source: string, category: Profit['category'], documentFile: File | null, currentDocumentUrl: string | undefined, removeExistingDocument: boolean) => {
      if (!userId) {
        showError("Usuário não autenticado. Não é possível editar lucros.");
        return;
      }
      
      const oldProfit = profits.find((p) => p.id === id);
      if (!oldProfit) return;

      let newDocumentUrl: string | undefined = currentDocumentUrl;

      if (removeExistingDocument && oldProfit.documentUrl) {
        await deleteDocument(oldProfit.documentUrl);
        newDocumentUrl = undefined;
      }

      if (documentFile) {
        if (oldProfit.documentUrl) {
          await deleteDocument(oldProfit.documentUrl);
        }
        const uploadedUrl = await uploadDocument(userId, documentFile);
        if (uploadedUrl) {
          newDocumentUrl = uploadedUrl;
        } else {
          showError("Falha ao fazer upload do novo documento.");
          return;
        }
      }

      // Revert old financial impact
      for (const dist of oldProfit.distributions) {
        await updatePartnerBalance(dist.partnerId, -dist.amount);
      }

      // Calculate new distributions based on new value and current partners
      const newDistributions: ProfitDistribution[] = partners.map((partner: Partner) => {
        const amount = (value * partner.participation) / 100;
        return {
          partnerId: partner.id,
          amount: amount,
        };
      });

      const updatedProfitData = {
        date,
        value,
        source,
        category,
        distributions: newDistributions,
        document_url: newDocumentUrl,
      };

      const { data, error } = await supabase
        .from('profits')
        .update(updatedProfitData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error("Error editing profit:", error);
        showError("Erro ao atualizar lucro.");
      } else if (data) {
        const updatedProfit: Profit = { ...data, date: new Date(data.date) };
        setProfits(prev => prev.map((p) => (p.id === id ? updatedProfit : p)));
        for (const dist of updatedProfit.distributions) {
          await updatePartnerBalance(dist.partnerId, dist.amount);
        }
        showSuccess("Lucro atualizado com sucesso!");
      }
    },
    [partners, profits, updatePartnerBalance, userId, setProfits]
  );

  const deleteProfit = useCallback(
    async (id: string) => {
      if (!userId) {
        showError("Usuário não autenticado. Não é possível excluir lucros.");
        return;
      }
      const profitToDelete = profits.find((p) => p.id === id);
      if (!profitToDelete) return;

      if (profitToDelete.documentUrl) {
        await deleteDocument(profitToDelete.documentUrl);
      }

      const { error } = await supabase
        .from('profits')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error("Error deleting profit:", error);
        showError("Erro ao excluir lucro.");
      } else {
        setProfits(prev => prev.filter((p) => p.id !== id));
        for (const dist of profitToDelete.distributions) {
          await updatePartnerBalance(dist.partnerId, -dist.amount);
        }
        showSuccess("Lucro excluído com sucesso!");
      }
    },
    [profits, updatePartnerBalance, userId, setProfits]
  );

  return (
    <ProfitsContext.Provider value={{ profits, addProfit, editProfit, deleteProfit, isLoadingProfits }}>
      {children}
    </ProfitsContext.Provider>
  );
};

export const useProfits = () => {
  const context = useContext(ProfitsContext);
  if (context === undefined) {
    throw new Error("useProfits must be used within a ProfitsProvider");
  }
  return context;
};