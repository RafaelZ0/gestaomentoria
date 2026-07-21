-- Data de "desde quando" o status atual vale, para tipos de entrega
-- (ativo/inativo) e tráfego pago do grupo (SIM/NÃO/PARADO/EM IMPLEMENTAÇÃO).
-- O status Ativo/Inativo do grupo já tem isso via grupos_gestao.data_termino.
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

alter table tipos_entrega add column if not exists status_desde date;
alter table grupos_gestao add column if not exists trafego_pago_desde date;
