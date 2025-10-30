export type Partner = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  participation: number;
  balance: number;
  user_id?: string; // Adicionado para RLS no Supabase
  created_at?: Date;
};

export type CostPayment = {
  partnerId: string;
  amount: number;
  paid: boolean;
};

export type Cost = {
  id: string;
  category: 'site' | 'provedor' | 'banco_de_dados' | 'outros';
  description?: string;
  value: number;
  date: Date;
  payerId: string;
  isRecurrent: boolean;
  payments: CostPayment[]; // Stored as JSONB in Supabase
  documentUrl?: string;
  user_id?: string; // Adicionado para RLS no Supabase
  created_at?: Date;
};

export type ProfitDistribution = {
  partnerId: string;
  amount: number;
};

export type Profit = {
  id: string;
  date: Date;
  value: number;
  source: string;
  category: 'operacional' | 'extraordinaria' | 'investimento' | 'outros';
  distributions: ProfitDistribution[]; // Stored as JSONB in Supabase
  documentUrl?: string;
  user_id?: string; // Adicionado para RLS no Supabase
  created_at?: Date;
};