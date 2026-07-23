-- Permite colar o link da reunião (Meet, Zoom etc) ao agendar uma reunião
-- futura, sem integrar com nenhuma API de calendário — a data já podia ser
-- futura antes, isso só adiciona um lugar pra guardar o link.
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

alter table reunioes add column if not exists link_reuniao text;
