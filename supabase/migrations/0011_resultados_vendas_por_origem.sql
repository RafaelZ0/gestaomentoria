-- Separa "vendas" em vendas por campanha interna e por tráfego pago,
-- espelhando a divisão que já existe em faturamento_campanha_interna /
-- faturamento_trafego_pago. Tabela ainda sem dados em produção até aqui,
-- então a coluna antiga pode ser removida com segurança.
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

alter table resultados_grupo drop column if exists vendas;
alter table resultados_grupo add column if not exists vendas_campanha_interna int not null default 0;
alter table resultados_grupo add column if not exists vendas_trafego_pago int not null default 0;
