alter table pagamentos add column if not exists status text not null default 'PAGO'
  check (status in ('PAGO', 'PENDENTE'));
