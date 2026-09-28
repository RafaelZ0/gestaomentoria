create table if not exists onboardings (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references grupos_gestao(id) on delete cascade,
  reuniao_id uuid references reunioes(id) unique,
  respostas jsonb not null default '{}',
  precisao jsonb not null default '{}',
  status text not null default 'rascunho' check (status in ('rascunho', 'concluido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table onboardings enable row level security;

create policy "authenticated full access" on onboardings
  for all to authenticated using (true) with check (true);

create index if not exists onboardings_grupo_id_idx on onboardings(grupo_id);
