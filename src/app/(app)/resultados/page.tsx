import { createClient } from "@/lib/supabase/server";
import { type LinhaRanking } from "@/components/ResultadosRankingTable";
import { type LinhaMensal } from "@/components/ResultadosPorMesTable";
import { ResultadosTabs } from "@/components/ResultadosTabs";

export default async function ResultadosPage() {
  const supabase = await createClient();

  const [{ data: grupos }, { data: resultados }] = await Promise.all([
    supabase
      .from("grupos_gestao")
      .select("id, nome, status")
      .eq("status", "Ativo")
      .order("nome", { ascending: true }),
    supabase
      .from("resultados_grupo")
      .select(
        "grupo_id, data, investimento, leads, faturamento_campanha_interna, faturamento_trafego_pago, vendas_campanha_interna, vendas_trafego_pago"
      ),
  ]);

  const idsAtivos = new Set((grupos ?? []).map((g) => g.id));
  const resultadosAtivos = (resultados ?? []).filter((r) =>
    idsAtivos.has(r.grupo_id)
  );

  const porGrupo = new Map<
    string,
    { investimento: number; faturamento: number; vendas: number }
  >();
  for (const r of resultadosAtivos) {
    const atual = porGrupo.get(r.grupo_id) ?? {
      investimento: 0,
      faturamento: 0,
      vendas: 0,
    };
    atual.investimento += Number(r.investimento);
    atual.faturamento +=
      Number(r.faturamento_campanha_interna) + Number(r.faturamento_trafego_pago);
    atual.vendas += r.vendas_campanha_interna + r.vendas_trafego_pago;
    porGrupo.set(r.grupo_id, atual);
  }

  const linhasRanking: LinhaRanking[] = (grupos ?? []).map((g) => {
    const m = porGrupo.get(g.id) ?? { investimento: 0, faturamento: 0, vendas: 0 };
    return {
      id: g.id,
      nome: g.nome,
      investimento: m.investimento,
      faturamento: m.faturamento,
      vendas: m.vendas,
      roas: m.investimento > 0 ? m.faturamento / m.investimento : null,
      ticketMedio: m.vendas > 0 ? m.faturamento / m.vendas : null,
    };
  });

  const porMes = new Map<
    string,
    { investimento: number; leads: number; faturamento: number; vendas: number }
  >();
  for (const r of resultadosAtivos) {
    const chave = r.data.slice(0, 7);
    const atual = porMes.get(chave) ?? {
      investimento: 0,
      leads: 0,
      faturamento: 0,
      vendas: 0,
    };
    atual.investimento += Number(r.investimento);
    atual.leads += r.leads;
    atual.faturamento +=
      Number(r.faturamento_campanha_interna) + Number(r.faturamento_trafego_pago);
    atual.vendas += r.vendas_campanha_interna + r.vendas_trafego_pago;
    porMes.set(chave, atual);
  }

  const linhasMensal: LinhaMensal[] = [...porMes.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([mes, m]) => ({
      mes,
      investimento: m.investimento,
      leads: m.leads,
      vendas: m.vendas,
      faturamento: m.faturamento,
      roas: m.investimento > 0 ? m.faturamento / m.investimento : null,
      ticketMedio: m.vendas > 0 ? m.faturamento / m.vendas : null,
    }));

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Resultados
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Somente grupos ativos. &quot;Por grupo&quot; ranqueia por ROAS
        (faturamento ÷ investido) — clique em Grupo, ROAS, Faturamento ou
        Vendas pra ordenar por essa coluna, ou na linha pra abrir o
        detalhamento do grupo. &quot;Por mês&quot; soma os resultados de
        todos os grupos ativos em cada mês, pra comparar a evolução ao longo
        do tempo.
      </p>

      <div className="mt-6">
        <ResultadosTabs linhasRanking={linhasRanking} linhasMensal={linhasMensal} />
      </div>
    </div>
  );
}
