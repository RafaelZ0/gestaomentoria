-- Horário da reunião agendada (opcional), pra poder montar a mensagem de
-- lembrete no WhatsApp com o horário certo. Reuniões já registradas
-- (histórico) continuam só com data, sem horário.
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

alter table reunioes add column if not exists hora time;
