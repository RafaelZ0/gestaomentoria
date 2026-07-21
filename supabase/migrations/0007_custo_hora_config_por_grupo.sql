-- Adapta o "Custo Hora" para o modelo de negócio real (mensalidade por
-- grupo/cliente de gestão de tráfego, não cobrança por hora trabalhada).
-- Remove os campos de horas/ociosidade, que não fazem sentido nesse modelo;
-- mantém percentual_fator_avaliacao como margem de segurança sobre o custo
-- por grupo.
-- Rodar no SQL Editor do projeto Supabase (Dashboard > SQL Editor > New query).
-- Idempotente: pode ser rodado de novo com segurança.

alter table custo_hora_config drop column if exists horas_atendimento_mes;
alter table custo_hora_config drop column if exists percentual_ociosidade;
