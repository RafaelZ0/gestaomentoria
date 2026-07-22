-- Permite registrar uma reunião agendada em que o grupo simplesmente não
-- compareceu (falta), para depois medir quantas faltas cada grupo teve e
-- ter uma noção de comparecimento. Reuniões normais continuam com
-- compareceu = true (padrão).
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

alter table reunioes add column if not exists compareceu boolean not null default true;
