-- Substitui o override de custo fixo mensal (valor único por mês) por
-- lançamentos itemizados por mês (ex: "Ferramenta X", "Freelancer Y"),
-- somados automaticamente. Quando não há itens para um mês, a tabela
-- mensal de Finanças continua usando o total atual de custos_fixos como
-- referência.
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

create table if not exists custos_fixos_mensais_itens (
  id uuid primary key default gen_random_uuid(),
  ano int not null,
  mes int not null check (mes between 1 and 12),
  nome text not null,
  valor numeric not null,
  created_at timestamptz default now()
);

alter table custos_fixos_mensais_itens enable row level security;

create policy "authenticated full access" on custos_fixos_mensais_itens
  for all to authenticated using (true) with check (true);

-- Migra overrides antigos (valor único por mês) para um item genérico.
insert into custos_fixos_mensais_itens (ano, mes, nome, valor)
select ano, mes, 'Custo do mês (migrado)', valor
from custos_fixos_mensais;

drop table if exists custos_fixos_mensais cascade;
