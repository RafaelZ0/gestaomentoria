import { createClient } from "@/lib/supabase/server";
import {
  ResultadosRankingTable,
  type LinhaRanking,
} from "@/components/ResultadosRankingTable";

export default async function ResultadosPage() {
  const supabase = await createClient();

  const [{ data: grupos }, { data: resultados }] = await Promise.all([
    supabase
      .from("grupos_gestao")
      .select("id, nome, status")
      .order("nome", { ascending: true }),
    supabase
      .from("resultados_grupo")
      .select(
        "grupo_id, investimento, faturamento_campanha_interna, faturamento_trafego_pago, vendas_campanha_interna, vendas_trafego_pago"
      ),
  ]);

  const porGrupo = new Map<
    string,
    { investimento: number; faturamento: number; vendas: number }
  >();
  for (const r of resultados ?? []) {
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

  const linhas: LinhaRanking[] = (grupos ?? []).map((g) => {
    const m = porGrupo.get(g.id) ?? { investimento: 0, faturamento: 0, vendas: 0 };
    return {
      id: g.id,
      nome: g.nome,
      status: g.status,
      investimento: m.investimento,
      faturamento: m.faturamento,
      vendas: m.vendas,
      roas: m.investimento > 0 ? m.faturamento / m.investimento : null,
    };
  });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Resultados
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Ranking por ROAS (faturamento ÷ investido) — clique numa coluna pra
        ordenar por outra métrica, ou na linha pra abrir o detalhamento do
        grupo.
      </p>

      <div className="mt-6">
        <ResultadosRankingTable linhas={linhas} />
      </div>
    </div>
  );
}
