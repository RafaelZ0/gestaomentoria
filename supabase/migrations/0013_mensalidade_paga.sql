-- Status de pagamento (Pago/Pendente/Atrasado) das mensalidades automáticas.
-- As mensalidades continuam sendo calculadas na hora (data de início +
-- valor mensal, ver datasVencimento em lib/format.ts) — essa tabela só
-- guarda a "exceção" de quais vencimentos já foram marcados como pagos.
-- Pendente/Atrasado é inferido automaticamente comparando o vencimento com
-- hoje (o vencimento mais recente é Pendente; qualquer um mais antigo sem
-- registro aqui é Atrasado). Pagamentos manuais (cláusula, ajustes) já são
-- registros de algo recebido, então sempre contam como Pago.
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

create table if not exists mensalidade_paga (
  grupo_id uuid not null references grupos_gestao(id) on delete cascade,
  data_vencimento date not null,
  data_pagamento date not null default current_date,
  created_at timestamptz default now(),
  primary key (grupo_id, data_vencimento)
);

alter table mensalidade_paga enable row level security;

create policy "authenticated full access" on mensalidade_paga
  for all to authenticated using (true) with check (true);
