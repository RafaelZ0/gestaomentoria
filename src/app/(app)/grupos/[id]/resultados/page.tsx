import { createClient } from "@/lib/supabase/server";
import { ResultadosList } from "@/components/ResultadosList";
import { EvolucaoResultadosChart } from "@/components/EvolucaoResultadosChart";

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: resultados } = await supabase
    .from("resultados_grupo")
    .select("*")
    .eq("grupo_id", id)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  const porMes = new Map<
    string,
    { investimento: number; leads: number; faturamento: number }
  >();
  for (const r of resultados ?? []) {
    const mes = r.data.slice(0, 7);
    const atual = porMes.get(mes) ?? { investimento: 0, leads: 0, faturamento: 0 };
    atual.investimento += Number(r.investimento);
    atual.leads += r.leads;
    atual.faturamento +=
      Number(r.faturamento_campanha_interna) + Number(r.faturamento_trafego_pago);
    porMes.set(mes, atual);
  }
  const evolucao = [...porMes.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, m]) => ({
      mes,
      faturamento: m.faturamento,
      roas: m.investimento > 0 ? m.faturamento / m.investimento : null,
      cpl: m.leads > 0 ? m.investimento / m.leads : null,
    }));

  return (
    <div className="space-y-8">
      <EvolucaoResultadosChart dados={evolucao} />
      <ResultadosList grupoId={id} resultados={resultados ?? []} />
    </div>
  );
}
