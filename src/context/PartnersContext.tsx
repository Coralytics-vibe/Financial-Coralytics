"use client";

import React, { createContext, useContext, useCallback } from "react"; // Removed useEffect
import { Partner } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface PartnersContextType {
  partners: Partner[];
  addPartner: (name: string, email: string, phone: string | undefined, document: string | undefined, participation: number) => void;
  updatePartnerBalance: (partnerId: string, amount: number) => void;
  editPartner: (id: string, name: string, email: string, phone: string | undefined, document: string | undefined, participation: number) => void;
  deletePartner: (id: string) => void;
  getTotalParticipation: () => number; // New: Get total participation
}

const PartnersContext = createContext<PartnersContextType | undefined>(undefined);

export const PartnersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [partners, setPartners] = useLocalStorage<Partner[]>("financial_app_partners", []);

  // Removed updateParticipation useEffect as participation is now user-defined

  const getTotalParticipation = useCallback(() => {
    return partners.reduce((sum, p) => sum + p.participation, 0);
  }, [partners]);

  const addPartner = (name: string, email: string, phone: string | undefined, document: string | undefined, participation: number) => {
    if (partners.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      showError("Já existe um sócio com este nome.");
      return;
    }
    if (partners.some(p => p.email.toLowerCase() === email.toLowerCase())) {
      showError("Já existe um sócio com este e-mail.");
      return;
    }

    const newPartner: Partner = {
      id: crypto.randomUUID(),
      name,
      email,
      phone,
      document,
      participation,
      balance: 0,
    };
    setPartners((prev) => {
      showSuccess("Sócio adicionado com sucesso!");
      return [...prev, newPartner];
    });
  };

  const updatePartnerBalance = (partnerId: string, amount: number) => {
    setPartners((prevPartners) =>
      prevPartners.map((p) =>
        p.id === partnerId ? { ...p, balance: p.balance + amount } : p
      )
    );
  };

  const editPartner = (id: string, name: string, email: string, phone: string | undefined, document: string | undefined, participation: number) => {
    if (partners.some(p => p.id !== id && p.name.toLowerCase() === name.toLowerCase())) {
      showError("Já existe outro sócio com este nome.");
      return;
    }
    if (partners.some(p => p.id !== id && p.email.toLowerCase() === email.toLowerCase())) {
      showError("Já existe outro sócio com este e-mail.");
      return;
    }

    setPartners((prevPartners) => {
      const updatedPartners = prevPartners.map((p) =>
        p.id === id ? { ...p, name, email, phone, document, participation } : p
      );
      showSuccess("Sócio atualizado com sucesso!");
      return updatedPartners;
    });
  };

  const deletePartner = (id: string) => {
    setPartners((prevPartners) => {
      const partnerToDelete = prevPartners.find(p => p.id === id);
      if (partnerToDelete && partnerToDelete.balance !== 0) {
        showError("Não é possível excluir um sócio com saldo diferente de zero.");
        return prevPartners;
      }
      const updatedPartners = prevPartners.filter((p) => p.id !== id);
      showSuccess("Sócio excluído com sucesso!");
      return updatedPartners;
    });
  };

  return (
    <PartnersContext.Provider value={{ partners, addPartner, updatePartnerBalance, editPartner, deletePartner, getTotalParticipation }}>
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