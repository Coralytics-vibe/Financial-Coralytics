"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { Cost, CostPayment, Partner } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { usePartners } from "./PartnersContext";
// import { useLocalStorage } from "@/hooks/use-local-storage"; // Not needed after migrating to Supabase
import { uploadDocument, deleteDocument } from "@/integrations/supabase/storage";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CostsContextType {
  costs: Cost[];
  addCost: (
    category: Cost['category'],
    description: string | undefined,
    value: number,
    date: Date,
    payerId: string,
    isRecurrent: boolean,
    documentFile: File | null
  ) => Promise<void>;
  markCostPaymentAsPaid: (costId: string, partnerId: string) => Promise<void>;
  editCost: (
    id: string,
    category: Cost['category'],
    description: string | undefined,
    value: number,
    date: Date,
    payerId: string,
    isRecurrent: boolean,
    documentFile: File | null,
    currentDocumentUrl: string | undefined,
    removeExistingDocument: boolean
  ) => Promise<void>;
  deleteCost: (costId: string) => Promise<void>;
  isLoadingCosts: boolean; // New: Loading state for costs
}

const CostsContext = createContext<CostsContextType | undefined>(undefined);

export const CostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [isLoadingCosts, setIsLoadingCosts] = useState(true);
  const { partners, updatePartnerBalance, isLoadingPartners } = usePartners();
  const { session, isLoading: isLoadingAuth } = useAuth();
  const userId = session?.user?.id;

  const fetchCosts = useCallback(async () => {
    if (!userId) {
      setCosts([]);
      setIsLoadingCosts(false);
      return;
    }
    setIsLoadingCosts(true);
    const { data, error } = await supabase
      .from('costs')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching costs:", error);
      showError("Erro ao carregar custos.");
      setCosts([]);
    } else {
      // Convert date strings back to Date objects
      const fetchedCosts: Cost[] = data.map(cost => ({
        ...cost,
        date: new Date(cost.date),
      }));
      setCosts(fetchedCosts || []);
    }
    setIsLoadingCosts(false);
  }, [userId]);

  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPartners) {
      fetchCosts();
    }
  }, [isLoadingAuth, isLoadingPartners, fetchCosts]);

  const addCost = useCallback(
    async (
      category: Cost['category'],
      description: string | undefined,
      value: number,
      date: Date,
      payerId: string,
      isRecurrent: boolean,
      documentFile: File | null
    ) => {
      if (!userId) {
        showError("Usuário não autenticado. Não é possível adicionar custos.");
        return;
      }
      if (partners.length === 0) {
        showError("Adicione sócios antes de registrar custos.");
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

      const costPerPartner = value / partners.length;
      const payments: CostPayment[] = partners.map((partner: Partner) => ({
        partnerId: partner.id,
        amount: costPerPartner,
        paid: false,
      }));

      const newCostData = {
        user_id: userId,
        category,
        description,
        value,
        date,
        payer_id: payerId,
        is_recurrent: isRecurrent,
        payments, // Stored as JSONB
        document_url: documentUrl,
      };

      const { data, error } = await supabase
        .from('costs')
        .insert(newCostData)
        .select()
        .single();

      if (error) {
        console.error("Error adding cost:", error);
        showError("Erro ao adicionar custo.");
      } else if (data) {
        const addedCost: Cost = { ...data, date: new Date(data.date) };
        setCosts((prev) => [...prev, addedCost]);
        await updatePartnerBalance(payerId, value);
        showSuccess("Custo adicionado com sucesso!");
      }
    },
    [partners, updatePartnerBalance, userId, setCosts]
  );

  const markCostPaymentAsPaid = useCallback(
    async (costId: string, partnerId: string) => {
      if (!userId) {
        showError("Usuário não autenticado. Não é possível marcar pagamentos.");
        return;
      }
      const costToUpdate = costs.find((c) => c.id === costId);
      if (!costToUpdate) return;

      const updatedPayments = costToUpdate.payments.map((payment: CostPayment) =>
        payment.partnerId === partnerId
          ? { ...payment, paid: !payment.paid }
          : payment
      );

      const { data, error } = await supabase
        .from('costs')
        .update({ payments: updatedPayments })
        .eq('id', costId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error("Error marking cost payment:", error);
        showError("Erro ao atualizar pagamento do custo.");
      } else if (data) {
        const updatedCost: Cost = { ...data, date: new Date(data.date) };
        setCosts((prevCosts) =>
          prevCosts.map((c) => (c.id === costId ? updatedCost : c))
        );

        const payment = updatedCost.payments.find((p: CostPayment) => p.partnerId === partnerId);
        if (payment) {
          const amount = payment.amount;
          const isCurrentlyPaid = payment.paid; // This is the *new* state of 'paid'

          if (isCurrentlyPaid) {
            await updatePartnerBalance(partnerId, -amount); // Partner's balance decreases (paid their share)
            await updatePartnerBalance(costToUpdate.payerId, -amount); // Payer's balance decreases (received payment)
            showSuccess(`${partners.find((p: Partner) => p.id === partnerId)?.name} pagou sua parte.`);
          } else {
            await updatePartnerBalance(partnerId, amount); // Partner's balance increases (payment reverted)
            await updatePartnerBalance(costToUpdate.payerId, amount); // Payer's balance increases (payment reverted)
            showSuccess(`${partners.find((p: Partner) => p.id === partnerId)?.name} teve o pagamento revertido.`);
          }
        }
      }
    },
    [partners, costs, updatePartnerBalance, userId, setCosts]
  );

  const editCost = useCallback(
    async (
      id: string,
      category: Cost['category'],
      description: string | undefined,
      value: number,
      date: Date,
      payerId: string,
      isRecurrent: boolean,
      documentFile: File | null,
      currentDocumentUrl: string | undefined,
      removeExistingDocument: boolean
    ) => {
      if (!userId) {
        showError("Usuário não autenticado. Não é possível editar custos.");
        return;
      }

      const oldCost = costs.find((c) => c.id === id);
      if (!oldCost) return;

      let newDocumentUrl: string | undefined = currentDocumentUrl;

      if (removeExistingDocument && oldCost.documentUrl) {
        await deleteDocument(oldCost.documentUrl);
        newDocumentUrl = undefined;
      }

      if (documentFile) {
        if (oldCost.documentUrl) {
          await deleteDocument(oldCost.documentUrl);
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
      await updatePartnerBalance(oldCost.payerId, -oldCost.value);
      for (const payment of oldCost.payments) {
        if (payment.paid) {
          await updatePartnerBalance(payment.partnerId, payment.amount);
          await updatePartnerBalance(oldCost.payerId, payment.amount);
        }
      }

      // Calculate new payments based on new value and current partners
      const costPerPartner = value / partners.length;
      const newPayments: CostPayment[] = partners.map((partner: Partner) => ({
        partnerId: partner.id,
        amount: costPerPartner,
        paid: false,
      }));

      const updatedCostData = {
        category,
        description,
        value,
        date,
        payer_id: payerId,
        is_recurrent: isRecurrent,
        payments: newPayments,
        document_url: newDocumentUrl,
      };

      const { data, error } = await supabase
        .from('costs')
        .update(updatedCostData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error("Error editing cost:", error);
        showError("Erro ao atualizar custo.");
      } else if (data) {
        const updatedCost: Cost = { ...data, date: new Date(data.date) };
        setCosts(prev => prev.map((c) => (c.id === id ? updatedCost : c)));
        await updatePartnerBalance(payerId, value);
        showSuccess("Custo atualizado com sucesso!");
      }
    },
    [partners, costs, updatePartnerBalance, userId, setCosts]
  );

  const deleteCost = useCallback(
    async (costId: string) => {
      if (!userId) {
        showError("Usuário não autenticado. Não é possível excluir custos.");
        return;
      }
      const costToDelete = costs.find((c) => c.id === costId);
      if (!costToDelete) return;

      const hasPaidPayments = costToDelete.payments.some(p => p.paid);
      if (hasPaidPayments) {
        showError("Não é possível excluir um custo com pagamentos já realizados. Desfaça os pagamentos primeiro.");
        return;
      }

      if (costToDelete.documentUrl) {
        await deleteDocument(costToDelete.documentUrl);
      }

      const { error } = await supabase
        .from('costs')
        .delete()
        .eq('id', costId)
        .eq('user_id', userId);

      if (error) {
        console.error("Error deleting cost:", error);
        showError("Erro ao excluir custo.");
      } else {
        setCosts(prev => prev.filter((c) => c.id !== costId));
        await updatePartnerBalance(costToDelete.payerId, -costToDelete.value);
        showSuccess("Custo excluído com sucesso!");
      }
    },
    [costs, updatePartnerBalance, userId, setCosts]
  );

  return (
    <CostsContext.Provider value={{ costs, addCost, markCostPaymentAsPaid, editCost, deleteCost, isLoadingCosts }}>
      {children}
    </CostsContext.Provider>
  );
};

export const useCosts = () => {
  const context = useContext(CostsContext);
  if (context === undefined) {
    throw new Error("useCosts must be used within a CostsProvider");
  }
  return context;
};