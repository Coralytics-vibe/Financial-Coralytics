"use client";

import React, { createContext, useContext, useEffect, useCallback } from "react"; // Removed useState
import { Partner } from "@/types";
import { showSuccess } from "@/utils/toast";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface PartnersContextType {
  partners: Partner[];
  addPartner: (name: string, email: string) => void;
  updatePartnerBalance: (partnerId: string, amount: number) => void;
}

const PartnersContext = createContext<PartnersContextType | undefined>(undefined);

export const PartnersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [partners, setPartners] = useLocalStorage<Partner[]>("financial_app_partners", []);

  // Recalculate participation whenever partners change
  const updateParticipation = useCallback((currentPartners: Partner[]) => {
    if (currentPartners.length > 0) {
      const newParticipation = 100 / currentPartners.length;
      return currentPartners.map((p) => ({ ...p, participation: newParticipation }));
    }
    return currentPartners;
  }, []);

  useEffect(() => {
    // This effect ensures participation is always up-to-date when partners array changes
    // It also handles initial load if partners were loaded from localStorage
    setPartners((prevPartners) => updateParticipation(prevPartners));
  }, [partners.length, updateParticipation, setPartners]);

  const addPartner = (name: string, email: string) => {
    const newPartner: Partner = {
      id: crypto.randomUUID(),
      name,
      email,
      participation: 0, // Will be recalculated by useEffect
      balance: 0,
    };
    setPartners((prev) => {
      const updatedPartners = [...prev, newPartner];
      showSuccess("Sócio adicionado com sucesso!");
      return updateParticipation(updatedPartners);
    });
  };

  const updatePartnerBalance = (partnerId: string, amount: number) => {
    setPartners((prevPartners) =>
      prevPartners.map((p) =>
        p.id === partnerId ? { ...p, balance: p.balance + amount } : p
      )
    );
  };

  return (
    <PartnersContext.Provider value={{ partners, addPartner, updatePartnerBalance }}>
      {children}
    </PartnersContext.Provider>
  );
};

export const usePartners = () => {
  const context = useContext(PartnersContext);
  if (context === undefined) {
    throw new Error("usePartners must be used within a PartnersProvider");
  }
  return context;
};