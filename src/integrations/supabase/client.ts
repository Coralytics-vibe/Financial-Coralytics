import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// DEBUG: confirme que as variáveis de build estão presentes
console.info('VITE_SUPABASE_URL (present?):', typeof import.meta.env.VITE_SUPABASE_URL !== 'undefined');
console.info('VITE_SUPABASE_ANON_KEY (present?):', typeof import.meta.env.VITE_SUPABASE_ANON_KEY !== 'undefined');

// Opcional — mostrar somente primeiros e últimos caracteres (não exponha toda a chave)
if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
  const k = import.meta.env.VITE_SUPABASE_ANON_KEY;
  console.info('VITE_SUPABASE_ANON_KEY (preview):', `${k.slice(0,6)}...${k.slice(-6)}`);
}

// Adicionando logs e uma verificação explícita para depuração
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente do Supabase ausentes!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey);
  throw new Error('A URL do Supabase e/ou a Chave Anon não estão definidas nas variáveis de ambiente. Por favor, verifique seu arquivo .env na raiz do projeto.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);