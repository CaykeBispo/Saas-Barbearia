-- ============================================================
--  SCHEMA MULTI-TENANT  —  Agenda IA
--  Rode este arquivo inteiro no Supabase: SQL Editor > New query > Cole > Run
--  Regra de ouro: TODA tabela do negócio referencia barbearia_id.
-- ============================================================

-- Extensão pra gerar UUIDs (normalmente já vem ativa no Supabase).
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) BARBEARIAS  (o "tenant" — cada linha é um cliente da plataforma)
-- ------------------------------------------------------------
create table if not exists barbearias (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  slug       text not null unique,          -- ex: "barbearia-do-joao" (vira a URL)
  telefone   text,
  criado_em  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2) PROFISSIONAIS  (quem atende dentro de uma barbearia)
-- ------------------------------------------------------------
create table if not exists profissionais (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid not null references barbearias(id) on delete cascade,
  nome          text not null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_profissionais_barbearia on profissionais(barbearia_id);

-- ------------------------------------------------------------
-- 3) SERVICOS  (corte, barba, etc — com duração e preço)
-- ------------------------------------------------------------
create table if not exists servicos (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid not null references barbearias(id) on delete cascade,
  nome          text not null,
  duracao_min   integer not null default 30,
  preco         numeric(10,2),
  criado_em     timestamptz not null default now()
);
create index if not exists idx_servicos_barbearia on servicos(barbearia_id);

-- ------------------------------------------------------------
-- 4) CLIENTES  (quem marca — do ponto de vista da barbearia)
-- ------------------------------------------------------------
create table if not exists clientes (
  id            uuid primary key default gen_random_uuid(),
  barbearia_id  uuid not null references barbearias(id) on delete cascade,
  nome          text not null,
  telefone      text,
  criado_em     timestamptz not null default now()
);
create index if not exists idx_clientes_barbearia on clientes(barbearia_id);

-- ------------------------------------------------------------
-- 5) AGENDAMENTOS  (o coração do sistema)
-- ------------------------------------------------------------
create table if not exists agendamentos (
  id               uuid primary key default gen_random_uuid(),
  barbearia_id     uuid not null references barbearias(id) on delete cascade,
  profissional_id  uuid references profissionais(id) on delete set null,
  servico_id       uuid references servicos(id) on delete set null,
  cliente_id       uuid references clientes(id) on delete set null,
  inicio           timestamptz not null,
  fim              timestamptz not null,
  status           text not null default 'pendente'
                     check (status in ('pendente','confirmado','cancelado','concluido')),
  observacao       text,
  criado_em        timestamptz not null default now()
);
create index if not exists idx_agendamentos_barbearia on agendamentos(barbearia_id);
create index if not exists idx_agendamentos_inicio on agendamentos(barbearia_id, inicio);

-- ============================================================
--  RLS (Row Level Security)
--  ATENÇÃO: para o MVP as policies abaixo LIBERAM tudo pra chave anônima,
--  só pra você conseguir ler/gravar rápido enquanto desenvolve.
--  ANTES DE PRODUÇÃO: trocar por policies reais (isolamento por barbearia +
--  autenticação do dono). Deixei um comentário no fim mostrando o caminho.
-- ============================================================
alter table barbearias    enable row level security;
alter table profissionais enable row level security;
alter table servicos      enable row level security;
alter table clientes      enable row level security;
alter table agendamentos  enable row level security;

-- Policies permissivas (MVP). Uma por tabela.
create policy "mvp_liberado" on barbearias    for all using (true) with check (true);
create policy "mvp_liberado" on profissionais for all using (true) with check (true);
create policy "mvp_liberado" on servicos      for all using (true) with check (true);
create policy "mvp_liberado" on clientes      for all using (true) with check (true);
create policy "mvp_liberado" on agendamentos  for all using (true) with check (true);

-- ============================================================
--  SEED  —  dados de exemplo pra página /barbearia-do-joao/agenda já funcionar
-- ============================================================
insert into barbearias (nome, slug, telefone)
values ('Barbearia do João', 'barbearia-do-joao', '11999998888')
on conflict (slug) do nothing;

-- Um profissional e um serviço de exemplo pra essa barbearia.
insert into profissionais (barbearia_id, nome)
select id, 'João' from barbearias where slug = 'barbearia-do-joao'
on conflict do nothing;

insert into servicos (barbearia_id, nome, duracao_min, preco)
select id, 'Corte', 30, 40.00 from barbearias where slug = 'barbearia-do-joao'
on conflict do nothing;

-- ============================================================
--  (FUTURO) Exemplo de policy real por barbearia, quando tiver login do dono:
--
--    create policy "dono_ve_sua_barbearia" on agendamentos
--      for all
--      using ( barbearia_id in (
--        select barbearia_id from membros where user_id = auth.uid()
--      ));
--
--  Ideia: uma tabela "membros(user_id, barbearia_id)" liga o usuário logado
--  (auth.uid()) à sua barbearia, e as policies filtram por isso.
-- ============================================================
