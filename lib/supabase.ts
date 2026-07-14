import { createClient } from "@supabase/supabase-js";

// Cliente Supabase usado no lado do servidor (Server Components / rotas).
// Usa a chave anônima (anon) — segura para expor, protegida pelas policies (RLS).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltam variáveis de ambiente do Supabase. Copie .env.local.example para .env.local e preencha."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
