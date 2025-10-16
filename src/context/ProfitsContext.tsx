"use client";

import React, { createContext, useContext, useCallback } from "react";
import { Profit, ProfitDistribution, Partner } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { usePartners } from "./PartnersContext";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface ProfitsContextType {
  profits: Profit[];
  addProfit: (date: Date, value: number, source: string, category: Profit['category']) => void;
  editProfit: (id: string, date: Date, value: number, source: string, category: Profit['category']) => void;
  deleteProfit: (id: string) => void;
}

const ProfitsContext = createContext<ProfitsContextType | undefined>(undefined);

export const ProfitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profits, setProfits] = useLocalStorage<Profit[]>("financial_app_profits", []);
  const { partners, updatePartnerBalance } = usePartners();

  const addProfit = useCallback(
    (date: Date, value: number, source: string, category: Profit['category']) => {
      if (partners.length === 0) {
        showError("Adicione sócios antes de registrar lucros.");
        return;
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
      };

      setProfits((prev) => [...prev, newProfit]);

      // Update balances for each partner
      distributions.forEach((dist) => {
        updatePartnerBalance(dist.partnerId, dist.amount);
      });

      showSuccess("Lucro registrado e distribuído com sucesso!");
    },
    [partners, updatePartnerBalance, setProfits]
  );

  const editProfit = useCallback(
    (id: string, date: Date, value: number, source: string, category: Profit['category']) => {
      setProfits((prevProfits) => {
        const oldProfit = prevProfits.find((p) => p.id === id);
        if (!oldProfit) return prevProfits;

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
        };

        // Apply new financial impact
        newDistributions.forEach((dist) => {
          updatePartnerBalance(dist.partnerId, dist.amount);
        });

        showSuccess("Lucro atualizado com sucesso!");
        return prevProfits.map((p) => (p.id === id ? updatedProfit : p));
      });
    },
    [partners, updatePartnerBalance, setProfits]
  );

  const deleteProfit = useCallback(
    (id: string) => {
      setProfits((prevProfits) => {
        const profitToDelete = prevProfits.find((p) => p.id === id);
        if (!profitToDelete) return prevProfits;

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