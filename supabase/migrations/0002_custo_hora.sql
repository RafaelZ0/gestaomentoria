-- Custo Hora — calculadora de custo por hora/minuto
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

drop table if exists custos_fixos cascade;
drop table if exists custo_hora_config cascade;

-- Lista de custos fixos (editável)
create table custos_fixos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor numeric not null default 0,
  ordem integer default 0,
  updated_at timestamptz default now()
);

-- Parâmetros do cálculo (linha única, editável na tela)
create table custo_hora_config (
  id int primary key default 1,
  horas_atendimento_mes numeric not null default 0,
  percentual_ociosidade numeric not null default 20,
  percentual_fator_avaliacao numeric not null default 15,
  constraint singleton check (id = 1)
);

insert into custo_hora_config (horas_atendimento_mes) values (0);

alter table custos_fixos enable row level security;
alter table custo_hora_config enable row level security;

create policy "authenticated full access" on custos_fixos
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on custo_hora_config
  for all to authenticated using (true) with check (true);
