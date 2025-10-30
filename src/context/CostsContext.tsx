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
    involvedPartnerIds: string[]
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
    involvedPartnerIds: string[]
  ) => void;
  deleteCost: (costId: string) => void;
}

const CostsContext = createContext<CostsContextType | undefined>(undefined);

// Custom deserializer for Cost objects to handle potential missing fields from old localStorage data
const costDeserializer = (value: string): Cost[] => {
  try {
    const parsed = JSON.parse(value, (_key, val) => {
      // Revive Date objects, similar to defaultDeserializer in use-local-storage
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(val)) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return val;
    });

    // Ensure it's an array and each cost has involvedPartnerIds and payments
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((cost: any) => ({
      ...cost,
      involvedPartnerIds: Array.isArray(cost.involvedPartnerIds) ? cost.involvedPartnerIds : [],
      payments: Array.isArray(cost.payments)
        ? cost.payments.map((payment: any) => ({
            partnerId: payment.partnerId,
            amount: payment.amount,
            paid: payment.paid ?? false, // Ensure 'paid' is boolean, default to false
          }))
        : [],
      date: cost.date instanceof Date ? cost.date : new Date(cost.date), // Ensure date is Date object
    }));
  } catch (error) {
    console.error("Failed to parse costs from localStorage:", error);
    return []; // Return empty array on error
  }
};

export const CostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [costs, setCosts] = useLocalStorage<Cost[]>("financial_app_costs", [], undefined, costDeserializer);
  const { partners, updatePartnerBalance } = usePartners();

  const addCost = useCallback(
    (
      category: Cost['category'],
      description: string | undefined,
      value: number,
      date: Date,
      payerId: string,
      isRecurrent: boolean,
      involvedPartnerIds: string[]
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
        .filter(p => involvedPartnerIds.includes(p.id))
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
        involvedPartnerIds,
        payments,
      };

      setCosts((prev) => [...prev, newCost]);

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
    (
      id: string,
      category: Cost['category'],
      description: string | undefined,
      value: number,
      date: Date,
      payerId: string,
      isRecurrent: boolean,
      involvedPartnerIds: string[]
    ) => {
      setCosts((prevCosts) => {
        const oldCost = prevCosts.find((c) => c.id === id);
        if (!oldCost) return prevCosts;

        if (involvedPartnerIds.length === 0) {
          showError("Selecione pelo menos um sócio envolvido no custo.");
          return prevCosts;
        }

        // Revert old financial impact
        updatePartnerBalance(oldCost.payerId, -oldCost.value);
        oldCost.payments.forEach((payment) => {
          if (payment.paid) {
            updatePartnerBalance(payment.partnerId, payment.amount);
            updatePartnerBalance(oldCost.payerId, payment.amount);
          }
        });

        // Calculate new payments based on new value and new involved partners
        const newCostPerPartner = value / involvedPartnerIds.length;
        const newPayments: CostPayment[] = partners
          .filter(p => involvedPartnerIds.includes(p.id))
          .map((partner: Partner) => ({
            partnerId: partner.id,
            amount: newCostPerPartner,
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
          involvedPartnerIds,
          payments: newPayments,
        };

        // Apply new financial impact
        updatePartnerBalance(payerId, value);

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

        const hasPaidPayments = costToDelete.payments.some(p => p.paid);
        if (hasPaidPayments) {
          showError("Não é possível excluir um custo com pagamentos já realizados. Desfaça os pagamentos primeiro.");
          return prevCosts;
        }

        updatePartnerBalance(costToDelete.payerId, -costToDelete.value);

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