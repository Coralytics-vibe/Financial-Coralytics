"use client";

import React, { createContext, useContext, useCallback } from "react";
import { Cost, CostPayment, Partner } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { usePartners } from "./PartnersContext";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface CostsContextType {
  costs: Cost[];
  addCost: (
    category: Cost['category'],
    description: string | undefined,
    value: number,
    date: Date,
    payerId: string,
    isRecurrent: boolean,
    involvedPartnerIds: string[] // New parameter
  ) => void;
  markCostPaymentAsPaid: (costId: string, partnerId: string) => void;
  editCost: (
    id: string,
    category: Cost['category'],
    description: string | undefined,
    value: number,
    date: Date,
    payerId: string,
    isRecurrent: boolean,
    involvedPartnerIds: string[] // New parameter
  ) => void;
  deleteCost: (costId: string) => void;
}

const CostsContext = createContext<CostsContextType | undefined>(undefined);

export const CostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [costs, setCosts] = useLocalStorage<Cost[]>("financial_app_costs", []);
  const { partners, updatePartnerBalance } = usePartners();

  const addCost = useCallback(
    (
      category: Cost['category'],
      description: string | undefined,
      value: number,
      date: Date,
      payerId: string,
      isRecurrent: boolean,
      involvedPartnerIds: string[] // New parameter
    ) => {
      if (partners.length === 0) {
        showError("Adicione sócios antes de registrar custos.");
        return;
      }
      if (involvedPartnerIds.length === 0) {
        showError("Selecione pelo menos um sócio envolvido no custo.");
        return;
      }

      const costPerPartner = value / involvedPartnerIds.length;
      const payments: CostPayment[] = partners
        .filter(p => involvedPartnerIds.includes(p.id)) // Only for involved partners
        .map((partner: Partner) => ({
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
        involvedPartnerIds, // Include new field
        payments,
      };

      setCosts((prev) => [...prev, newCost]);

      // Update balances: Payer's balance increases by the total value
      updatePartnerBalance(payerId, value);

      showSuccess("Custo adicionado com sucesso!");
    },
    [partners, updatePartnerBalance, setCosts]
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
            const isCurrentlyPaid = !payment.paid; // This is the state *before* the toggle, so it's the opposite of the new state

            if (isCurrentlyPaid) {
              // If it was unpaid and is now marked as paid
              updatePartnerBalance(partnerId, -amount); // Partner's balance decreases (they paid their share)
              updatePartnerBalance(cost.payerId, -amount); // Payer's balance decreases (they received reimbursement)
              showSuccess(`${partners.find((p: Partner) => p.id === partnerId)?.name} pagou sua parte.`);
            } else {
              // If it was paid and is now marked as unpaid
              updatePartnerBalance(partnerId, amount); // Partner's balance increases (they are owed again)
              updatePartnerBalance(cost.payerId, amount); // Payer's balance increases (they are owed again)
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
    (
      id: string,
      category: Cost['category'],
      description: string | undefined,
      value: number,
      date: Date,
      payerId: string,
      isRecurrent: boolean,
      involvedPartnerIds: string[] // New parameter
    ) => {
      setCosts((prevCosts) => {
        const oldCost = prevCosts.find((c) => c.id === id);
        if (!oldCost) return prevCosts;

        if (involvedPartnerIds.length === 0) {
          showError("Selecione pelo menos um sócio envolvido no custo.");
          return prevCosts; // Prevent update if no partners are involved
        }

        // Revert old financial impact
        updatePartnerBalance(oldCost.payerId, -oldCost.value); // Payer's balance decreases by old total value
        oldCost.payments.forEach((payment) => {
          if (payment.paid) {
            updatePartnerBalance(payment.partnerId, payment.amount); // Partner gets money back
            updatePartnerBalance(oldCost.payerId, payment.amount); // Payer "returns" reimbursement
          }
        });

        // Calculate new payments based on new value and new involved partners
        const newCostPerPartner = value / involvedPartnerIds.length;
        const newPayments: CostPayment[] = partners
          .filter(p => involvedPartnerIds.includes(p.id))
          .map((partner: Partner) => ({
            partnerId: partner.id,
            amount: newCostPerPartner,
            paid: false, // Reset paid status for simplicity on edit
          }));

        const updatedCost: Cost = {
          id,
          category,
          description,
          value,
          date,
          payerId,
          isRecurrent,
          involvedPartnerIds, // Include new field
          payments: newPayments,
        };

        // Apply new financial impact
        updatePartnerBalance(payerId, value); // New payer's balance increases by new total value

        showSuccess("Custo atualizado com sucesso!");
        return prevCosts.map((c) => (c.id === id ? updatedCost : c));
      });
    },
    [partners, updatePartnerBalance, setCosts]
  );

  const deleteCost = useCallback(
    (costId: string) => {
      setCosts((prevCosts) => {
        const costToDelete = prevCosts.find((c) => c.id === costId);
        if (!costToDelete) return prevCosts;

        // Check if any payments are marked as paid
        const hasPaidPayments = costToDelete.payments.some(p => p.paid);
        if (hasPaidPayments) {
          showError("Não é possível excluir um custo com pagamentos já realizados. Desfaça os pagamentos primeiro.");
          return prevCosts;
        }

        // Revert financial impact
        updatePartnerBalance(costToDelete.payerId, -costToDelete.value); // Payer's balance decreases by total value

        showSuccess("Custo excluído com sucesso!");
        return prevCosts.filter((c) => c.id !== costId);
      });
    },
    [updatePartnerBalance, setCosts]
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