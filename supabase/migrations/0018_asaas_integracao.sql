-- Integração com Asaas: liga cada grupo a um cliente Asaas (ID anotado
-- manualmente) e permite que o webhook de pagamento confirmado lance o
-- pagamento automaticamente, evitando duplicata via asaas_payment_id.
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

alter table grupos_gestao add column if not exists asaas_customer_id text;
create unique index if not exists grupos_gestao_asaas_customer_id_idx
  on grupos_gestao(asaas_customer_id) where asaas_customer_id is not null;

alter table pagamentos add column if not exists asaas_payment_id text;
create unique index if not exists pagamentos_asaas_payment_id_idx
  on pagamentos(asaas_payment_id) where asaas_payment_id is not null;
