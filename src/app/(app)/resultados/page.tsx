import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";

function calcCpl(investimento: number, leads: number): string {
  if (!leads) return "—";
  return formatBRL(investimento / leads);
}

export default async function ResultadosPage() {
  const supabase = await createClient();

  const { data: resultados } = await supabase
    .from("resultados_grupo")
    .select("*, grupos_gestao(nome)");

  type ResultadoComGrupo = {
    grupo_id: string;
    investimento: number;
    leads: number;
    vendas: number;
    faturamento_campanha_interna: number;
    faturamento_trafego_pago: number;
    grupos_gestao: { nome: string } | null;
  };

  const linhas = (resultados ?? []) as unknown as ResultadoComGrupo[];

  const totalGeral = linhas.reduce(
    (acc, r) => ({
      investimento: acc.investimento + Number(r.investimento),
      leads: acc.leads + r.leads,
      vendas: acc.vendas + r.vendas,
      faturamento:
        acc.faturamento +
        Number(r.faturamento_campanha_interna) +
        Number(r.faturamento_trafego_pago),
    }),
    { investimento: 0, leads: 0, vendas: 0, faturamento: 0 }
  );

  const porGrupo = new Map<
    string,
    {
      nome: string;
      investimento: number;
      leads: number;
      vendas: number;
      faturamento: number;
    }
  >();
  for (const r of linhas) {
    const atual = porGrupo.get(r.grupo_id) ?? {
      nome: r.grupos_gestao?.nome ?? "—",
      investimento: 0,
      leads: 0,
      vendas: 0,
      faturamento: 0,
    };
    atual.investimento += Number(r.investimento);
    atual.leads += r.leads;
    atual.vendas += r.vendas;
    atual.faturamento +=
      Number(r.faturamento_campanha_interna) + Number(r.faturamento_trafego_pago);
    porGrupo.set(r.grupo_id, atual);
  }

  const gruposOrdenados = [...porGrupo.entries()].sort(
    (a, b) => b[1].investimento - a[1].investimento
  );

  return (
    <div className="max-w-6xl">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
          Resultados
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Investimento, leads, vendas e faturamento de tráfego pago, somando
          todos os grupos. Lance os resultados na aba "Resultados" de cada
          grupo.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card-hero rounded-xl border border-border bg-bg-surface p-6 sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-text-secondary">Investido</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums text-text-primary">
            {formatBRL(totalGeral.investimento)}
          </p>
        </div>
        <InfoCard label="Leads" value={String(totalGeral.leads)} />
        <InfoCard
          label="CPL médio"
          value={calcCpl(totalGeral.investimento, totalGeral.leads)}
        />
        <InfoCard label="Vendas" value={String(totalGeral.vendas)} />
        <InfoCard label="Faturamento" value={formatBRL(totalGeral.faturamento)} />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Por grupo
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-secondary">
                <th className="px-4 py-3 font-medium">Grupo</th>
                <th className="px-4 py-3 font-medium">Investido</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium">CPL</th>
                <th className="px-4 py-3 font-medium">Vendas</th>
                <th className="px-4 py-3 font-medium">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {gruposOrdenados.map(([grupoId, r]) => (
                <tr
                  key={grupoId}
                  className="border-b border-border last:border-0 hover:bg-bg-surface-hover"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    <Link href={`/grupos/${grupoId}/resultados`} className="hover:text-accent">
                      {r.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-primary">
                    {formatBRL(r.investimento)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-primary">
                    {r.leads}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-primary">
                    {calcCpl(r.investimento, r.leads)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-primary">
                    {r.vendas}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-status-ok-text">
                    {formatBRL(r.faturamento)}
                  </td>
                </tr>
              ))}
              {gruposOrdenados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    Nenhum resultado registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-xl font-semibold tracking-tight tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}
