-- Override de custos fixos por mês histórico (ex: meses iniciais com menos
-- gastos do que hoje). Quando não há registro para um mês, a tabela mensal
-- de Finanças usa o total atual de custos_fixos.
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

drop table if exists custos_fixos_mensais cascade;

create table custos_fixos_mensais (
  ano int not null,
  mes int not null check (mes between 1 and 12),
  valor numeric not null,
  updated_at timestamptz default now(),
  primary key (ano, mes)
);

alter table custos_fixos_mensais enable row level security;

create policy "authenticated full access" on custos_fixos_mensais
  for all to authenticated using (true) with check (true);
