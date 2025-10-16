"use client";

import React, { createContext, useContext, useCallback } from "react"; // Removed useState
import { Profit, ProfitDistribution, Partner } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { usePartners } from "./PartnersContext";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface ProfitsContextType {
  profits: Profit[];
  addProfit: (date: Date, value: number, source: string) => void;
}

const ProfitsContext = createContext<ProfitsContextType | undefined>(undefined);

export const ProfitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profits, setProfits] = useLocalStorage<Profit[]>("financial_app_profits", []);
  const { partners, updatePartnerBalance } = usePartners();

  const addProfit = useCallback(
    (date: Date, value: number, source: string) => {
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

  return (
    <ProfitsContext.Provider value={{ profits, addProfit }}>
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