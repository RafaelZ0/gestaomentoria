-- Enriquece Tarefas com prazo, prioridade e responsável (Pablo/Rafael),
-- já que o login do sistema é compartilhado entre os dois.
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

alter table tarefas add column if not exists prazo date;
alter table tarefas add column if not exists prioridade text not null default 'Média' check (prioridade in ('Baixa','Média','Alta'));
alter table tarefas add column if not exists responsavel_id uuid references responsaveis(id);
