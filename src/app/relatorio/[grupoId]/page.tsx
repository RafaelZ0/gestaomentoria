import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { displayGroupName, formatBRL, formatDate, formatMesAno } from "@/lib/format";
import { cplDe, roasDe, variacoesEntre, type MetricasMes } from "@/lib/tendencia";
import { BotaoImprimir } from "@/components/BotaoImprimir";

// Relatório mensal do grupo pra imprimir / salvar em PDF pelo navegador.
// Fundo claro, sem a barra lateral. Tudo calculado na hora.
export default async function RelatorioPage({
  params,
  searchParams,
}: {
  params: Promise<{ grupoId: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { grupoId } = await params;
  const { mes: mesParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: grupo }, { data: resultados }, { data: responsaveis }] = await Promise.all([
    supabase.from("grupos_gestao").select("id, nome").eq("id", grupoId).single(),
    supabase.from("resultados_grupo").select("*").eq("grupo_id", grupoId),
    supabase.from("responsaveis").select("id, nome"),
  ]);
  if (!grupo) notFound();

  const porMes = new Map<string, MetricasMes>();
  for (const r of resultados ?? []) {
    const mes = r.data.slice(0, 7);
    const a = porMes.get(mes) ?? { investimento: 0, leads: 0, vendas: 0, faturamento: 0 };
    a.investimento += Number(r.investimento);
    a.leads += r.leads;
    a.vendas += r.vendas_campanha_interna + r.vendas_trafego_pago;
    a.faturamento += Number(r.faturamento_campanha_interna) + Number(r.faturamento_trafego_pago);
    porMes.set(mes, a);
  }
  const meses = [...porMes.keys()].sort();
  const mes = mesParam && /^\d{4}-\d{2}$/.test(mesParam) ? mesParam : (meses.at(-1) ?? new Date().toISOString().slice(0, 7));
  const atual = porMes.get(mes) ?? null;
  // Mês anterior = o último mês com lançamento antes deste.
  const mesAnterior = meses.filter((m) => m < mes).at(-1) ?? null;
  const anterior = mesAnterior ? porMes.get(mesAnterior)! : null;
  const v = atual ? variacoesEntre(atual, anterior) : null;

  const [ano, m] = mes.split("-").map(Number);
  const proximo = new Date(ano, m, 1);
  const proximoISO = `${proximo.getFullYear()}-${String(proximo.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: reunioes } = await supabase
    .from("reunioes")
    .select("data, hora, resumo, compareceu, responsavel_id")
    .eq("grupo_id", grupoId)
    .gte("data", `${mes}-01`)
    .lt("data", proximoISO)
    .order("data", { ascending: true });

  const nomeResp = new Map((responsaveis ?? []).map((r) => [r.id, r.nome]));
  const rotuloAnterior = mesAnterior
    ? formatMesAno(Number(mesAnterior.slice(0, 4)), Number(mesAnterior.slice(5, 7))).toLocaleLowerCase("pt-BR")
    : null;

  const cpl = atual ? cplDe(atual) : null;
  const roas = atual ? roasDe(atual) : null;
  const ticket = atual && atual.vendas > 0 ? atual.faturamento / atual.vendas : null;

  const metricas: { rotulo: string; valor: string; variacao?: React.ReactNode }[] = atual
    ? [
        { rotulo: "Investido", valor: formatBRL(atual.investimento) },
        { rotulo: "Leads", valor: atual.leads.toLocaleString("pt-BR") },
        { rotulo: "CPL", valor: cpl === null ? "—" : formatBRL(cpl), variacao: <Var valor={v?.cpl} melhorQuandoMaior={false} rotuloAnterior={rotuloAnterior} /> },
        { rotulo: "Vendas", valor: atual.vendas.toLocaleString("pt-BR"), variacao: <Var valor={v?.vendas} rotuloAnterior={rotuloAnterior} /> },
        { rotulo: "Faturamento", valor: formatBRL(atual.faturamento), variacao: <Var valor={v?.faturamento} rotuloAnterior={rotuloAnterior} /> },
        { rotulo: "ROAS", valor: roas === null ? "—" : `${roas.toFixed(1)}x`, variacao: <Var valor={v?.roas} rotuloAnterior={rotuloAnterior} /> },
        { rotulo: "Ticket médio", valor: ticket === null ? "—" : formatBRL(ticket) },
      ]
    : [];

  return (
    <div className="relatorio min-h-screen bg-white text-black print:min-h-0">
      <div className="mx-auto max-w-[760px] px-8 py-10 print:px-0 print:py-0">
        <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
          <a href={`/grupos/${grupoId}/resultados`} className="text-sm text-black/60 hover:text-black">
            ← Voltar ao grupo
          </a>
          <BotaoImprimir />
        </div>

        <header className="border-b border-black/15 pb-5">
          <p className="text-[13px] uppercase tracking-wider text-black/55">Relatório mensal</p>
          <h1 className="mt-1 font-serif text-[34px] font-medium leading-tight tracking-[-0.015em]">
            {displayGroupName(grupo.nome)}
          </h1>
          <p className="mt-1 text-[16px] text-black/70">{formatMesAno(ano, m)}</p>
        </header>

        <section className="mt-7">
          <h2 className="text-[15px] font-semibold">Resultados do mês</h2>
          {atual ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4 print:grid-cols-4">
                {metricas.map((x) => (
                  <div key={x.rotulo} className="flex flex-col gap-1">
                    <span className="text-[12.5px] text-black/55">{x.rotulo}</span>
                    <span className="text-[19px] font-medium tabular-nums">{x.valor}</span>
                    {x.variacao}
                  </div>
                ))}
              </div>
              {!mesAnterior && (
                <p className="mt-4 text-[12.5px] text-black/55">
                  Sem mês anterior com lançamento para comparar.
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-black/60">Nenhum lançamento de resultado neste mês.</p>
          )}
        </section>

        <section className="mt-9">
          <h2 className="text-[15px] font-semibold">Reuniões do mês</h2>
          {(reunioes ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-black/60">Nenhuma reunião registrada neste mês.</p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {(reunioes ?? []).map((r, i) => (
                <li key={i} className="break-inside-avoid border-b border-black/10 py-3 last:border-0">
                  <p className="text-[14px] font-medium">
                    {formatDate(r.data)}
                    {r.hora ? ` às ${r.hora.slice(0, 5)}` : ""}
                    {r.responsavel_id && (
                      <span className="font-normal text-black/55"> · {nomeResp.get(r.responsavel_id)}</span>
                    )}
                    {!r.compareceu && <span className="font-normal text-danger-impressao"> · não compareceu</span>}
                  </p>
                  {r.resumo && <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-black/80">{r.resumo}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-10 border-t border-black/10 pt-3 text-[11.5px] text-black/45">
          Gerado em {formatDate(new Date().toISOString().slice(0, 10))} · Gestão de Tráfego
        </footer>
      </div>
    </div>
  );
}

function Var({
  valor,
  melhorQuandoMaior = true,
  rotuloAnterior,
}: {
  valor: number | null | undefined;
  melhorQuandoMaior?: boolean;
  rotuloAnterior: string | null;
}) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return null;
  const pct = Math.round(valor * 100);
  if (pct === 0) return <span className="block text-[12px] text-black/50">= mês anterior</span>;
  const bom = pct > 0 === melhorQuandoMaior;
  return (
    <span className={`block text-[12px] ${bom ? "text-ok-impressao" : "text-danger-impressao"}`}>
      {pct > 0 ? "↑" : "↓"} {Math.abs(pct)}% vs {rotuloAnterior}
    </span>
  );
}