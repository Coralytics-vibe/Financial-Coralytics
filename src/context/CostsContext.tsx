"use client";

import React, { createContext, useContext, useCallback } from "react";
import { Cost, CostPayment, Partner } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { usePartners } from "./PartnersContext";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { uploadDocument, deleteDocument } from "@/integrations/supabase/storage";
import { useAuth } from "./AuthContext";

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
  markCostPaymentAsPaid: (costId: string, partnerId: string) => void;
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
}

const CostsContext = createContext<CostsContextType | undefined>(undefined);

export const CostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [costs, setCosts] = useLocalStorage<Cost[]>("financial_app_costs", []);
  const { partners, updatePartnerBalance } = usePartners();
  const { session } = useAuth();
  const userId = session?.user?.id;

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

      const newCost: Cost = {
        id: crypto.randomUUID(),
        category,
        description,
        value,
        date,
        payerId,
        isRecurrent,
        payments,
        documentUrl,
      };

      setCosts((prev) => [...prev, newCost]);

      updatePartnerBalance(payerId, value);

      showSuccess("Custo adicionado com sucesso!");
    },
    [partners, updatePartnerBalance, setCosts, userId]
  );

  const markCostPaymentAsPaid = useCallback(
    (costId: string, partnerId: string) => {
      setCosts((prevCosts) => {
        const updatedCosts = prevCosts.map((cost) =>
          cost.id === costId
            ? {
                ...cost,
                payments: cost.payments.map((payment: CostPayment) =>
                  payment.partnerId === partnerId
                    ? { ...payment, paid: !payment.paid }
                    : payment
                ),
              }
            : cost
        );

        const cost = updatedCosts.find((c) => c.id === costId);
        if (cost) {
          const payment = cost.payments.find((p: CostPayment) => p.partnerId === partnerId);
          if (payment) {
            const amount = payment.amount;
            const isCurrentlyPaid = !payment.paid; 

            if (isCurrentlyPaid) {
              updatePartnerBalance(partnerId, -amount); 
              updatePartnerBalance(cost.payerId, -amount); 
              showSuccess(`${partners.find((p: Partner) => p.id === partnerId)?.name} pagou sua parte.`);
            } else {
              updatePartnerBalance(partnerId, amount); 
              updatePartnerBalance(cost.payerId, amount); 
              showSuccess(`${partners.find((p: Partner) => p.id === partnerId)?.name} teve o pagamento revertido.`);
            }
          }
        }
        return updatedCosts;
      });
    },
    [partners, updatePartnerBalance, setCosts]
  );

  const editCost = useCallback(
    async ( // Make the outer function async
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

      // Get current state synchronously
      const currentCosts = costs; 
      const oldCost = currentCosts.find((c) => c.id === id);
      if (!oldCost) return;

      // Handle document changes (all async operations here)
      let newDocumentUrl: string | undefined = currentDocumentUrl;

      if (removeExistingDocument && oldCost.documentUrl) {
        await deleteDocument(oldCost.documentUrl);
        newDocumentUrl = undefined;
      }

      if (documentFile) {
        if (oldCost.documentUrl) {
          await deleteDocument(oldCost.documentUrl); // Delete old document if new one is uploaded
        }
        const uploadedUrl = await uploadDocument(userId, documentFile);
        if (uploadedUrl) {
          newDocumentUrl = uploadedUrl;
        } else {
          showError("Falha ao fazer upload do novo documento.");
          return;
        }
      }

      // Revert old financial impact (synchronous updates to partner balances)
      updatePartnerBalance(oldCost.payerId, -oldCost.value); 
      oldCost.payments.forEach((payment) => {
        if (payment.paid) {
          updatePartnerBalance(payment.partnerId, payment.amount); 
          updatePartnerBalance(oldCost.payerId, payment.amount); 
        }
      });

      // Calculate new payments based on new value and current partners
      const costPerPartner = value / partners.length;
      const newPayments: CostPayment[] = partners.map((partner: Partner) => ({
        partnerId: partner.id,
        amount: costPerPartner,
        paid: false, 
      }));

      const updatedCost: Cost = {
        id,
        category,
        description,
        value,
        date,
        payerId,
        isRecurrent,
        payments: newPayments,
        documentUrl: newDocumentUrl,
      };

      // Apply new financial impact (synchronous updates to partner balances)
      updatePartnerBalance(payerId, value); 

      // Update state synchronously after all async work is done
      setCosts(prev => prev.map((c) => (c.id === id ? updatedCost : c)));

      showSuccess("Custo atualizado com sucesso!");
    },
    [partners, updatePartnerBalance, setCosts, userId, costs] // Add 'costs' to dependencies
  );

  const deleteCost = useCallback(
    async (costId: string) => { // Make the outer function async
      const currentCosts = costs; // Get current state synchronously
      const costToDelete = currentCosts.find((c) => c.id === costId);
      if (!costToDelete) return;

      const hasPaidPayments = costToDelete.payments.some(p => p.paid);
      if (hasPaidPayments) {
        showError("Não é possível excluir um custo com pagamentos já realizados. Desfaça os pagamentos primeiro.");
        return;
      }

      // Delete associated document if it exists (async operation)
      if (costToDelete.documentUrl) {
        await deleteDocument(costToDelete.documentUrl);
      }

      updatePartnerBalance(costToDelete.payerId, -costToDelete.value); 

      // Update state synchronously after all async work is done
      setCosts(prev => prev.filter((c) => c.id !== costId));

      showSuccess("Custo excluído com sucesso!");
    },
    [updatePartnerBalance, setCosts, costs] // Add 'costs' to dependencies
  );

  return (
    <CostsContext.Provider value={{ costs, addCost, markCostPaymentAsPaid, editCost, deleteCost }}>
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