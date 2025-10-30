export type Partner = {
  id: string;
  name: string;
  email: string;
  phone?: string; // New: Optional phone number
  document?: string; // New: Optional CPF/CNPJ
  participation: number; // Percentage, e.g., 25 for 25%
  balance: number; // Individual balance, positive if owed to them, negative if they owe
};

export type CostPayment = {
  partnerId: string;
  amount: number; // Amount this partner owes for this specific cost
  paid: boolean;
};

export type Cost = {
  id: string;
  category: 'site' | 'provedor' | 'banco_de_dados' | 'outros';
  description?: string; // Optional description for the cost
  value: number;
  date: Date;
  payerId: string; // ID of the partner who paid
  isRecurrent: boolean;
  payments: CostPayment[]; // How much each partner owes for this cost
  documentUrl?: string; // New: Optional URL for an attached document
};

export type ProfitDistribution = {
  partnerId: string;
  amount: number;
};

export type Profit = {
  id: string;
  date: Date;
  value: number;
  source: string; // e.g., 'cliente', 'serviço', 'produto'
  category: 'operacional' | 'extraordinaria' | 'investimento' | 'outros'; // New: Category for profit
  distributions: ProfitDistribution[]; // How much each partner receives
  documentUrl?: string; // New: Optional URL for an attached document
};