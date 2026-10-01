-- Fim previsto do contrato (para os avisos de renovação). Separado de
-- data_termino, que é a data em que o grupo foi cancelado/encerrado.
alter table grupos_gestao add column if not exists data_fim_contrato date;
