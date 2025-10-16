import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Adicionando logs e uma verificação explícita para depuração
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase ausentes!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);
  throw new Error('A URL do Supabase e/ou a Chave Anon não estão definidas nas variáveis de ambiente. Por favor, verifique seu arquivo .env na raiz do projeto.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);