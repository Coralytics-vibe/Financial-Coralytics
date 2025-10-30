"use client";

import React, { createContext, useContext, useCallback } from "react";
import { Profit, ProfitDistribution, Partner } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { usePartners } from "./PartnersContext";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { uploadDocument, deleteDocument } from "@/integrations/supabase/storage";
import { useAuth } from "./AuthContext";

interface ProfitsContextType {
  profits: Profit[];
  addProfit: (date: Date, value: number, source: string, category: Profit['category'], documentFile: File | null) => Promise<void>;
  editProfit: (id: string, date: Date, value: number, source: string, category: Profit['category'], documentFile: File | null, currentDocumentUrl: string | undefined, removeExistingDocument: boolean) => Promise<void>;
  deleteProfit: (id: string) => Promise<void>;
}

const ProfitsContext = createContext<ProfitsContextType | undefined>(undefined);

export const ProfitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profits, setProfits] = useLocalStorage<Profit[]>("financial_app_profits", []);
  const { partners, updatePartnerBalance } = usePartners();
  const { session } = useAuth();
  const userId = session?.user?.id;

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

      const newProfit: Profit = {
        id: crypto.randomUUID(),
        date,
        value,
        source,
        category,
        distributions,
        documentUrl,
      };

      setProfits((prev) => [...prev, newProfit]);

      distributions.forEach((dist) => {
        updatePartnerBalance(dist.partnerId, dist.amount);
      });

      showSuccess("Lucro registrado e distribuído com sucesso!");
    },
    [partners, updatePartnerBalance, setProfits, userId]
  );

  const editProfit = useCallback(
    async (id: string, date: Date, value: number, source: string, category: Profit['category'], documentFile: File | null, currentDocumentUrl: string | undefined, removeExistingDocument: boolean) => {
      if (!userId) {
        showError("Usuário não autenticado. Não é possível editar lucros.");
        return;
      }
      setProfits(async (prevProfits) => {
        const oldProfit = prevProfits.find((p) => p.id === id);
        if (!oldProfit) return prevProfits;

        // Handle document changes
        let newDocumentUrl: string | undefined = currentDocumentUrl;

        if (removeExistingDocument && oldProfit.documentUrl) {
          await deleteDocument(oldProfit.documentUrl);
          newDocumentUrl = undefined;
        }

        if (documentFile) {
          if (oldProfit.documentUrl) {
            await deleteDocument(oldProfit.documentUrl); // Delete old document if new one is uploaded
          }
          const uploadedUrl = await uploadDocument(userId, documentFile);
          if (uploadedUrl) {
            newDocumentUrl = uploadedUrl;
          } else {
            showError("Falha ao fazer upload do novo documento.");
            return prevProfits;
          }
        }

        // Revert old financial impact
        oldProfit.distributions.forEach((dist) => {
          updatePartnerBalance(dist.partnerId, -dist.amount);
        });

        // Calculate new distributions based on new value and current partners
        const newDistributions: ProfitDistribution[] = partners.map((partner: Partner) => {
          const amount = (value * partner.participation) / 100;
          return {
            partnerId: partner.id,
            amount: amount,
          };
        });

        const updatedProfit: Profit = {
          id,
          date,
          value,
          source,
          category,
          distributions: newDistributions,
          documentUrl: newDocumentUrl,
        };

        // Apply new financial impact
        newDistributions.forEach((dist) => {
          updatePartnerBalance(dist.partnerId, dist.amount);
        });

        showSuccess("Lucro atualizado com sucesso!");
        return prevProfits.map((p) => (p.id === id ? updatedProfit : p));
      });
    },
    [partners, updatePartnerBalance, setProfits, userId]
  );

  const deleteProfit = useCallback(
    async (id: string) => {
      setProfits(async (prevProfits) => {
        const profitToDelete = prevProfits.find((p) => p.id === id);
        if (!profitToDelete) return prevProfits;

        // Delete associated document if it exists
        if (profitToDelete.documentUrl) {
          await deleteDocument(profitToDelete.documentUrl);
        }

        // Revert financial impact
        profitToDelete.distributions.forEach((dist) => {
          updatePartnerBalance(dist.partnerId, -dist.amount);
        });

        showSuccess("Lucro excluído com sucesso!");
        return prevProfits.filter((p) => p.id !== id);
      });
    },
    [updatePartnerBalance, setProfits]
  );

  return (
    <ProfitsContext.Provider value={{ profits, addProfit, editProfit, deleteProfit }}>
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