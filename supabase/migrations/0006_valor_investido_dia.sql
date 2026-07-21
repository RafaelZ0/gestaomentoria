-- Valor investido por dia em tráfego pago, editável direto na visão geral
-- do grupo (sem precisar abrir o formulário de edição completo).
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

alter table grupos_gestao add column if not exists valor_investido_dia numeric;
