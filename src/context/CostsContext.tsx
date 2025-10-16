"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Cost, CostPayment, Partner } from "@/types";
import { showSuccess, showError } from "@/utils/toast";
import { usePartners } from "./PartnersContext"; // Import usePartners to update partner balances

interface CostsContextType {
  costs: Cost[];
  addCost: (
    category: Cost['category'],
    description: string | undefined,
    value: number,
    date: Date,
    payerId: string,
    isRecurrent: boolean
  ) => void;
  markCostPaymentAsPaid: (costId: string, partnerId: string) => void;
}

const CostsContext = createContext<CostsContextType | undefined>(undefined);

export const CostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [costs, setCosts] = useState<Cost[]>([]);
  const { partners, updatePartnerBalance } = usePartners();

  const addCost = useCallback(
    (
      category: Cost['category'],
      description: string | undefined,
      value: number,
      date: Date,
      payerId: string,
      isRecurrent: boolean
    ) => {
      if (partners.length === 0) {
        showError("Adicione sócios antes de registrar custos.");
        return;
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
      };

      setCosts((prev) => [...prev, newCost]);

      // Update balances: Payer's balance increases by the total value
      updatePartnerBalance(payerId, value);

      showSuccess("Custo adicionado com sucesso!");
    },
    [partners, updatePartnerBalance]
  );

  const markCostPaymentAsPaid = useCallback(
    (costId: string, partnerId: string) => {
      setCosts((prevCosts) =>
        prevCosts.map((cost) =>
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
        )
      );

      const cost = costs.find((c) => c.id === costId);
      if (cost) {
        const payment = cost.payments.find((p: CostPayment) => p.partnerId === partnerId);
        if (payment) {
          const amount = payment.amount;
          const isCurrentlyPaid = payment.paid; // This is the state *before* the toggle

          if (!isCurrentlyPaid) {
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
    },
    [costs, partners, updatePartnerBalance]
  );

  return (
    <CostsContext.Provider value={{ costs, addCost, markCostPaymentAsPaid }}>
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