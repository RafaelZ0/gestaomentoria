-- Metas por cliente (CPL alvo, ROAS alvo), pra comparar com o realizado
-- (Último CPL / ROAS já calculados a partir de resultados_grupo).
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

alter table grupos_gestao add column if not exists meta_cpl numeric;
alter table grupos_gestao add column if not exists meta_roas numeric;
