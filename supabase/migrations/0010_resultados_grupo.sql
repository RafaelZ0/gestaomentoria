-- Resultados de tráfego pago por grupo (investimento, leads, vendas,
-- faturamento separado por origem). Lançamentos avulsos, com data livre
-- (não amarrados a um mês fechado).
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

create table if not exists resultados_grupo (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references grupos_gestao(id) on delete cascade,
  data date not null,
  investimento numeric not null default 0,
  leads int not null default 0,
  vendas int not null default 0,
  faturamento_campanha_interna numeric not null default 0,
  faturamento_trafego_pago numeric not null default 0,
  observacao text,
  created_at timestamptz default now()
);

alter table resultados_grupo enable row level security;

create policy "authenticated full access" on resultados_grupo
  for all to authenticated using (true) with check (true);
