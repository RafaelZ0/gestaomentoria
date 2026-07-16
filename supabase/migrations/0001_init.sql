-- Gestão de Tráfego / Mentorados — schema inicial
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Este script é idempotente: pode ser rodado de novo com segurança (ele
-- limpa qualquer tentativa anterior antes de recriar tudo do zero).

-- Limpeza de uma tentativa anterior, se houver
drop table if exists entregas_grupo cascade;
drop table if exists tarefas cascade;
drop table if exists pagamentos cascade;
drop table if exists reunioes cascade;
drop table if exists mentorados cascade;
drop table if exists tipos_entrega cascade;
drop table if exists grupos_gestao cascade;
drop function if exists set_updated_at cascade;

-- Grupos de gestão (o cliente/contrato)
create table grupos_gestao (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_inicio date not null,
  status text not null check (status in ('Ativo','Inativo')) default 'Ativo',
  data_termino date,
  trafego_pago text check (trafego_pago in ('SIM','NÃO','PARADO','EM IMPLEMENTAÇÃO')),
  valor_mensal numeric not null,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mentorados (pessoas dentro de um grupo — pode ter mais de um)
create table mentorados (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references grupos_gestao(id) on delete cascade,
  nome text not null,
  telefone text
);

-- Tipos de entrega (lista extensível)
create table tipos_entrega (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean default true
);

-- Reuniões (o "mini-diário" por cliente)
create table reunioes (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references grupos_gestao(id) on delete cascade,
  data date not null default current_date,
  resumo text not null,
  created_at timestamptz default now()
);

-- Checklist de entregas por grupo
create table entregas_grupo (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references grupos_gestao(id) on delete cascade,
  tipo_entrega_id uuid references tipos_entrega(id),
  feito boolean default false,
  data_feito date,
  reuniao_id uuid references reunioes(id),
  unique (grupo_id, tipo_entrega_id)
);

-- Histórico de pagamentos
create table pagamentos (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references grupos_gestao(id) on delete cascade,
  data date not null,
  valor numeric not null,
  tipo text not null default 'MENSALIDADE'
    check (tipo in ('MENSALIDADE','CLAUSULA_CANCELAMENTO')),
  observacao text,
  created_at timestamptz default now()
);

-- Tarefas pendentes por grupo
create table tarefas (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid references grupos_gestao(id) on delete cascade,
  descricao text not null,
  concluida boolean default false,
  created_at timestamptz default now()
);

-- Popular os 6 tipos de entrega que já existem na planilha
insert into tipos_entrega (nome) values
  ('CAMPANHA INTERNA'),
  ('PLANILHA DE PRECIFICAÇÃO'),
  ('PLANILHA DE FUNIL'),
  ('PLANILHA DE PARCELAMENTO'),
  ('PLANILHA DE CONTROLE DE METAS'),
  ('PLANILHA DE ENTRADA PROGRAMADA');

-- updated_at automático em grupos_gestao
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger grupos_gestao_set_updated_at
  before update on grupos_gestao
  for each row
  execute function set_updated_at();

-- RLS: login único compartilhado — qualquer usuário autenticado tem acesso total.
alter table grupos_gestao enable row level security;
alter table mentorados enable row level security;
alter table tipos_entrega enable row level security;
alter table reunioes enable row level security;
alter table entregas_grupo enable row level security;
alter table pagamentos enable row level security;
alter table tarefas enable row level security;

create policy "authenticated full access" on grupos_gestao
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on mentorados
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on tipos_entrega
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on reunioes
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on entregas_grupo
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on pagamentos
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on tarefas
  for all to authenticated using (true) with check (true);
