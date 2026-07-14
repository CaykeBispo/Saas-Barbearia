// Tipos que espelham o schema do banco (supabase/schema.sql).

export type Barbearia = {
  id: string;
  nome: string;
  slug: string;
  telefone: string | null;
  criado_em: string;
};

export type Profissional = {
  id: string;
  barbearia_id: string;
  nome: string;
  ativo: boolean;
  criado_em: string;
};

export type Servico = {
  id: string;
  barbearia_id: string;
  nome: string;
  duracao_min: number;
  preco: number | null;
  criado_em: string;
};

export type Cliente = {
  id: string;
  barbearia_id: string;
  nome: string;
  telefone: string | null;
  criado_em: string;
};

export type StatusAgendamento =
  | "pendente"
  | "confirmado"
  | "cancelado"
  | "concluido";

export type Agendamento = {
  id: string;
  barbearia_id: string;
  profissional_id: string | null;
  servico_id: string | null;
  cliente_id: string | null;
  inicio: string; // timestamptz
  fim: string; // timestamptz
  status: StatusAgendamento;
  observacao: string | null;
  criado_em: string;
};
