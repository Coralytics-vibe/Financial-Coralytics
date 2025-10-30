"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { Partner } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext"; // Import useAuth

interface PartnersContextType {
  partners: Partner[];
  addPartner: (name: string, email: string, phone: string | undefined, document: string | undefined, participation: number) => Promise<void>;
  updatePartnerBalance: (partnerId: string, amount: number) => Promise<void>;
  editPartner: (id: string, name: string, email: string, phone: string | undefined, document: string | undefined, participation: number) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  getTotalParticipation: () => number;
  isLoadingPartners: boolean; // New: Loading state for partners
}

const PartnersContext = createContext<PartnersContextType | undefined>(undefined);

export const PartnersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const { session, isLoading: isLoadingAuth } = useAuth();
  const userId = session?.user?.id;

  const fetchPartners = useCallback(async () => {
    if (!userId) {
      setPartners([]);
      setIsLoadingPartners(false);
      return;
    }
    setIsLoadingPartners(true);
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching partners:", error);
      showError("Erro ao carregar sócios.");
      setPartners([]);
    } else {
      setPartners(data || []);
    }
    setIsLoadingPartners(false);
  }, [userId]);

  useEffect(() => {
    if (!isLoadingAuth) {
      fetchPartners();
    }
  }, [isLoadingAuth, fetchPartners]);

  const getTotalParticipation = useCallback(() => {
    return partners.reduce((sum, p) => sum + p.participation, 0);
  }, [partners]);

  const addPartner = useCallback(async (name: string, email: string, phone: string | undefined, document: string | undefined, participation: number) => {
    if (!userId) {
      showError("Usuário não autenticado. Não é possível adicionar sócios.");
      return;
    }
    if (partners.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      showError("Já existe um sócio com este nome.");
      return;
    }
    if (partners.some(p => p.email.toLowerCase() === email.toLowerCase())) {
      showError("Já existe um sócio com este e-mail.");
      return;
    }

    const newPartner: Omit<Partner, 'id' | 'created_at'> = {
      user_id: userId,
      name,
      email,
      phone,
      document,
      participation,
      balance: 0,
    };

    const { data, error } = await supabase
      .from('partners')
      .insert(newPartner)
      .select()
      .single();

    if (error) {
      console.error("Error adding partner:", error);
      showError("Erro ao adicionar sócio.");
    } else if (data) {
      setPartners((prev) => {
        showSuccess("Sócio adicionado com sucesso!");
        return [...prev, data];
      });
    }
  }, [partners, userId, setPartners]);

  const updatePartnerBalance = useCallback(async (partnerId: string, amount: number) => {
    if (!userId) {
      console.error("Usuário não autenticado. Não é possível atualizar o saldo do sócio.");
      return;
    }
    const partnerToUpdate = partners.find(p => p.id === partnerId);
    if (!partnerToUpdate) {
      console.error("Sócio não encontrado para atualização de saldo.");
      return;
    }

    const newBalance = partnerToUpdate.balance + amount;

    const { data, error } = await supabase
      .from('partners')
      .update({ balance: newBalance })
      .eq('id', partnerId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating partner balance:", error);
      showError("Erro ao atualizar saldo do sócio.");
    } else if (data) {
      setPartners((prev) =>
        prev.map((p) =>
          p.id === partnerId ? data : p
        )
      );
    }
  }, [partners, userId, setPartners]);

  const editPartner = useCallback(async (id: string, name: string, email: string, phone: string | undefined, document: string | undefined, participation: number) => {
    if (!userId) {
      showError("Usuário não autenticado. Não é possível editar sócios.");
      return;
    }
    if (partners.some(p => p.id !== id && p.name.toLowerCase() === name.toLowerCase())) {
      showError("Já existe outro sócio com este nome.");
      return;
    }
    if (partners.some(p => p.id !== id && p.email.toLowerCase() === email.toLowerCase())) {
      showError("Já existe outro sócio com este e-mail.");
      return;
    }

    const updatedPartnerData: Partial<Partner> = {
      name,
      email,
      phone,
      document,
      participation,
    };

    const { data, error } = await supabase
      .from('partners')
      .update(updatedPartnerData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error("Error editing partner:", error);
      showError("Erro ao atualizar sócio.");
    } else if (data) {
      setPartners((prevPartners) => {
        showSuccess("Sócio atualizado com sucesso!");
        return prevPartners.map((p) =>
          p.id === id ? data : p
        );
      });
    }
  }, [partners, userId, setPartners]);

  const deletePartner = useCallback(async (id: string) => {
    if (!userId) {
      showError("Usuário não autenticado. Não é possível excluir sócios.");
      return;
    }
    const partnerToDelete = partners.find(p => p.id === id);
    if (partnerToDelete && partnerToDelete.balance !== 0) {
      showError("Não é possível excluir um sócio com saldo diferente de zero.");
      return;
    }

    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error("Error deleting partner:", error);
      showError("Erro ao excluir sócio.");
    } else {
      setPartners((prevPartners) => {
        showSuccess("Sócio excluído com sucesso!");
        return prevPartners.filter((p) => p.id !== id);
      });
    }
  }, [partners, userId, setPartners]);

  return (
    <PartnersContext.Provider value={{ partners, addPartner, updatePartnerBalance, editPartner, deletePartner, getTotalParticipation, isLoadingPartners }}>
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