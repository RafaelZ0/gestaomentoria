-- Responsáveis (quem conduziu a reunião: Pablo, Rafael, ou outros que forem
-- cadastrados depois) + participantes por reunião. Uma reunião pode ter
-- participantes de mais de um grupo de gestão (ex: duas pessoas de grupos
-- diferentes na mesma call); ela passa a aparecer automaticamente na aba
-- "Reuniões" de cada grupo que tiver um mentorado participante, sem precisar
-- cadastrar de novo em cada grupo.
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

create table if not exists responsaveis (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz default now()
);

insert into responsaveis (nome) values ('Pablo'), ('Rafael')
  on conflict (nome) do nothing;

alter table reunioes add column if not exists responsavel_id uuid references responsaveis(id);

create table if not exists reuniao_participantes (
  reuniao_id uuid not null references reunioes(id) on delete cascade,
  mentorado_id uuid not null references mentorados(id) on delete cascade,
  primary key (reuniao_id, mentorado_id)
);

alter table responsaveis enable row level security;
alter table reuniao_participantes enable row level security;

create policy "authenticated full access" on responsaveis
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on reuniao_participantes
  for all to authenticated using (true) with check (true);
