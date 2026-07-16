import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";
import { LancamentosList } from "@/components/LancamentosList";

export default async function FinancasPage() {
  const supabase = await createClient();

  const [
    { data: pagamentos },
    { data: grupos },
    { data: custosFixos },
    { data: lancamentos },
  ] = await Promise.all([
    supabase.from("pagamentos").select("*"),
    supabase.from("grupos_gestao").select("*"),
    supabase.from("custos_fixos").select("*"),
    supabase
      .from("lancamentos_financeiros")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const faturamentoGrupos = (pagamentos ?? []).reduce(
    (acc, p) => acc + Number(p.valor),
    0
  );
  const valorClausulas = (pagamentos ?? [])
    .filter((p) => p.tipo === "CLAUSULA_CANCELAMENTO")
    .reduce((acc, p) => acc + Number(p.valor), 0);

  const receitasAvulsas = (lancamentos ?? [])
    .filter((l) => l.tipo === "RECEITA")
    .reduce((acc, l) => acc + Number(l.valor), 0);
  const despesasAvulsas = (lancamentos ?? [])
    .filter((l) => l.tipo === "DESPESA")
    .reduce((acc, l) => acc + Number(l.valor), 0);

  const totalReceitas = faturamentoGrupos + receitasAvulsas;
  const margemAcumulada = totalReceitas - despesasAvulsas;

  const custosFixosMensais = (custosFixos ?? []).reduce(
    (acc, c) => acc + Number(c.valor),
    0
  );

  const gruposCancelados = (grupos ?? []).filter(
    (g) => g.status === "Inativo"
  ).length;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Finanças
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Visão consolidada da consultoria: faturamento dos grupos de gestão
          somado a receitas e despesas avulsas.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <p className="text-sm text-text-secondary">Margem acumulada</p>
        <p
          className={`mt-2 font-display text-4xl font-bold tabular-nums ${
            margemAcumulada >= 0 ? "text-text-primary" : "text-status-alert-text"
          }`}
        >
          {formatBRL(margemAcumulada)}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Total de receitas − despesas avulsas
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Total de receitas" value={formatBRL(totalReceitas)} />
        <InfoCard label="Despesas avulsas" value={formatBRL(despesasAvulsas)} />
        <InfoCard
          label="Custos fixos mensais"
          value={formatBRL(custosFixosMensais)}
          hint="ver Custo Hora"
          href="/custo-hora"
        />
        <InfoCard
          label="Grupos cancelados"
          value={String(gruposCancelados)}
          hint={`${formatBRL(valorClausulas)} em cláusulas`}
        />
      </div>

      <p className="text-xs text-text-secondary">
        Faturamento dos grupos: {formatBRL(faturamentoGrupos)} · Receitas
        avulsas: {formatBRL(receitasAvulsas)}. Custos fixos mensais são um
        valor de referência (não somado à margem acima, que reflete os
        lançamentos avulsos ao longo do tempo).
      </p>

      <section>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Lançamentos
        </h2>
        <div className="mt-3">
          <LancamentosList lancamentos={lancamentos ?? []} />
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      {hint &&
        (href ? (
          <Link
            href={href}
            className="mt-1 block text-xs text-accent hover:text-accent-hover"
          >
            {hint}
          </Link>
        ) : (
          <p className="mt-1 text-xs text-text-secondary">{hint}</p>
        ))}
    </div>
  );
}
