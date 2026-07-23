import { createClient } from "@/lib/supabase/server";
import { type LinhaRanking } from "@/components/ResultadosRankingTable";
import {
  type LinhaClinicaMes,
  type MesComparativo,
} from "@/components/ResultadosComparativoMensal";
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

  const nomePorGrupo = new Map((grupos ?? []).map((g) => [g.id, g.nome]));

  const porMesEClinica = new Map<
    string,
    Map<
      string,
      { investimento: number; leads: number; faturamento: number; vendas: number }
    >
  >();
  for (const r of resultadosAtivos) {
    const chaveMes = r.data.slice(0, 7);
    const porClinica = porMesEClinica.get(chaveMes) ?? new Map();
    const atual = porClinica.get(r.grupo_id) ?? {
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
    porClinica.set(r.grupo_id, atual);
    porMesEClinica.set(chaveMes, porClinica);
  }

  const meses: MesComparativo[] = [...porMesEClinica.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([mes, porClinica]) => {
      const clinicas: LinhaClinicaMes[] = [...porClinica.entries()].map(
        ([grupoId, m]) => ({
          id: grupoId,
          nome: nomePorGrupo.get(grupoId) ?? "—",
          investimento: m.investimento,
          leads: m.leads,
          vendas: m.vendas,
          faturamento: m.faturamento,
          roas: m.investimento > 0 ? m.faturamento / m.investimento : null,
          ticketMedio: m.vendas > 0 ? m.faturamento / m.vendas : null,
        })
      );
      return { mes, clinicas };
    });

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Resultados
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Somente grupos ativos. &quot;Por grupo&quot; ranqueia por ROAS
        (faturamento ÷ investido) — clique em Grupo, ROAS, Faturamento ou
        Vendas pra ordenar por essa coluna, ou na linha pra abrir o
        detalhamento do grupo. &quot;Por mês&quot; abre cada mês pra comparar
        lado a lado como cada clínica performou naquele período.
      </p>

      <div className="mt-6">
        <ResultadosTabs linhasRanking={linhasRanking} meses={meses} />
      </div>
    </div>
  );
}
