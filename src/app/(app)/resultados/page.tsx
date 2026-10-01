import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { type LinhaRanking } from "@/components/ResultadosRankingTable";
import {
  type LinhaClinicaMes,
  type MesComparativo,
} from "@/components/ResultadosComparativoMensal";
import { ResultadosTabs } from "@/components/ResultadosTabs";
import { PageHeader } from "@/components/ui/PageHeader";
import { cplDe, roasDe, variacoesEntre, type MetricasMes } from "@/lib/tendencia";

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

  const porGrupo = new Map<string, MetricasMes>();
  for (const r of resultadosAtivos) {
    const atual = porGrupo.get(r.grupo_id) ?? {
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
    porGrupo.set(r.grupo_id, atual);
  }

  const nomePorGrupo = new Map((grupos ?? []).map((g) => [g.id, g.nome]));

  const porMesEClinica = new Map<string, Map<string, MetricasMes>>();
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

  // Meses do mais recente pro mais antigo. "Mês anterior" de uma clínica é
  // o último mês em que ELA teve lançamento.
  const mesesOrdenados = [...porMesEClinica.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  function anteriorDaClinica(grupoId: string, indiceMes: number): MetricasMes | null {
    for (let i = indiceMes + 1; i < mesesOrdenados.length; i++) {
      const m = mesesOrdenados[i][1].get(grupoId);
      if (m) return m;
    }
    return null;
  }

  function somarMes(porClinica: Map<string, MetricasMes>): MetricasMes {
    const s = { investimento: 0, leads: 0, faturamento: 0, vendas: 0 };
    for (const m of porClinica.values()) {
      s.investimento += m.investimento;
      s.leads += m.leads;
      s.faturamento += m.faturamento;
      s.vendas += m.vendas;
    }
    return s;
  }

  const meses: MesComparativo[] = mesesOrdenados.map(([mes, porClinica], i) => {
    const clinicas: LinhaClinicaMes[] = [...porClinica.entries()].map(([grupoId, m]) => ({
      id: grupoId,
      nome: nomePorGrupo.get(grupoId) ?? "—",
      investimento: m.investimento,
      leads: m.leads,
      vendas: m.vendas,
      faturamento: m.faturamento,
      cpl: cplDe(m),
      roas: roasDe(m),
      ticketMedio: m.vendas > 0 ? m.faturamento / m.vendas : null,
      variacoes: variacoesEntre(m, anteriorDaClinica(grupoId, i)),
    }));
    const anterior = mesesOrdenados[i + 1];
    return {
      mes,
      clinicas,
      variacoes: variacoesEntre(somarMes(porClinica), anterior ? somarMes(anterior[1]) : null),
    };
  });

  // Tendência de cada grupo no ranking: último mês com lançamento contra o
  // anterior com lançamento.
  function variacoesDoGrupo(grupoId: string) {
    const doGrupo = mesesOrdenados
      .map(([, porClinica]) => porClinica.get(grupoId))
      .filter((m): m is MetricasMes => !!m);
    return variacoesEntre(doGrupo[0] ?? { investimento: 0, leads: 0, faturamento: 0, vendas: 0 }, doGrupo[1] ?? null);
  }

  const linhasRanking: LinhaRanking[] = (grupos ?? []).map((g) => {
    const m = porGrupo.get(g.id);
    if (!m) {
      return {
        id: g.id,
        nome: g.nome,
        temLancamento: false,
        investimento: 0,
        faturamento: 0,
        vendas: 0,
        cpl: null,
        roas: null,
        ticketMedio: null,
        variacoes: { cpl: null, roas: null, faturamento: null, vendas: null },
      };
    }
    return {
      id: g.id,
      nome: g.nome,
      temLancamento: true,
      investimento: m.investimento,
      faturamento: m.faturamento,
      vendas: m.vendas,
      cpl: cplDe(m),
      roas: roasDe(m),
      ticketMedio: m.vendas > 0 ? m.faturamento / m.vendas : null,
      variacoes: variacoesDoGrupo(g.id),
    };
  });

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-8">
      <PageHeader
        titulo="Resultados"
        ajuda={
          <p>
            Somente grupos ativos. &quot;Por grupo&quot; ranqueia por ROAS (faturamento ÷
            investido) — clique em Grupo, ROAS, Faturamento ou Vendas pra ordenar por essa
            coluna, ou na linha pra abrir o detalhamento do grupo. &quot;Por mês&quot; abre cada
            mês pra comparar lado a lado como cada clínica performou naquele período.
          </p>
        }
        acoes={
          <Link href="/resultados/lancar" prefetch={false} className="btn-primary">
            Lançar resultados
          </Link>
        }
      />

      <ResultadosTabs linhasRanking={linhasRanking} meses={meses} />
    </div>
  );
}
