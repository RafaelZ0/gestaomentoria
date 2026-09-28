import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { calcDuracaoDias } from "@/lib/format";
import { calcSaudeGrupo, calcTendenciaRoas } from "@/lib/saude";

// Dedup via React cache(): layout.tsx e a page.tsx de cada aba do grupo
// chamam getGrupo(id) independentemente, mas dentro da mesma requisição
// isso vira uma única busca ao Supabase em vez de uma por componente.
export const getGrupo = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("grupos_gestao")
    .select("*")
    .eq("id", id)
    .single();
  return data;
});

// Saúde do cliente (mesma regra de calcSaudeGrupo que a Visão geral usava):
// dias desde a última reunião do grupo, tendência de ROAS entre os dois
// últimos meses com lançamento e processos ativos pendentes. Fica no
// cabeçalho do grupo, então vale pra todas as abas.
export const getSaudeGrupo = cache(async (id: string) => {
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const [{ data: ultimaReuniao }, { data: entregas }, { data: resultados }] =
    await Promise.all([
      supabase
        .from("reunioes")
        .select("data")
        .eq("grupo_id", id)
        .lte("data", hoje)
        .order("data", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("entregas_grupo")
        .select("feito, tipos_entrega(ativo)")
        .eq("grupo_id", id),
      supabase
        .from("resultados_grupo")
        .select("data, investimento, faturamento_campanha_interna, faturamento_trafego_pago")
        .eq("grupo_id", id),
    ]);

  const diasSemReuniao = ultimaReuniao ? calcDuracaoDias(ultimaReuniao.data, null) : null;

  type EntregaRow = { feito: boolean; tipos_entrega: { ativo: boolean } | null };
  const processosIncompletos = ((entregas ?? []) as unknown as EntregaRow[]).filter(
    (e) => e.tipos_entrega?.ativo && !e.feito
  ).length;

  const porMes = new Map<string, { investimento: number; faturamento: number }>();
  for (const r of resultados ?? []) {
    const mes = r.data.slice(0, 7);
    const atual = porMes.get(mes) ?? { investimento: 0, faturamento: 0 };
    atual.investimento += Number(r.investimento);
    atual.faturamento +=
      Number(r.faturamento_campanha_interna) + Number(r.faturamento_trafego_pago);
    porMes.set(mes, atual);
  }
  const tendenciaRoas = calcTendenciaRoas(
    [...porMes.entries()].map(([mes, v]) => ({ mes, ...v }))
  );

  return {
    diasSemReuniao,
    ...calcSaudeGrupo({ diasSemReuniao, tendenciaRoas, processosIncompletos }),
  };
});
