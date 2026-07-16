-- Finanças da consultoria — lançamentos avulsos de receita/despesa
-- (o faturamento dos grupos de gestão já vem de `pagamentos`; isto aqui é
-- para receitas e despesas que não estão ligadas a um grupo específico).
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

drop table if exists lancamentos_financeiros cascade;

create table lancamentos_financeiros (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('RECEITA','DESPESA')),
  descricao text not null,
  categoria text,
  valor numeric not null,
  data date not null default current_date,
  created_at timestamptz default now()
);

alter table lancamentos_financeiros enable row level security;

create policy "authenticated full access" on lancamentos_financeiros
  for all to authenticated using (true) with check (true);
