import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";
import { calcTabelaMensal } from "@/lib/finance";
import { LancamentosList } from "@/components/LancamentosList";
import { TabelaMensalFinancas } from "@/components/TabelaMensalFinancas";

export default async function FinancasPage() {
  const supabase = await createClient();

  const [
    { data: pagamentos },
    { data: grupos },
    { data: custosFixos },
    { data: lancamentos },
    { data: custosFixosMensaisOverrides },
  ] = await Promise.all([
    supabase.from("pagamentos").select("*"),
    supabase.from("grupos_gestao").select("*"),
    supabase.from("custos_fixos").select("*"),
    supabase
      .from("lancamentos_financeiros")
      .select("*")
      .order("data", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("custos_fixos_mensais").select("*"),
  ]);

  const custosFixosMensais = (custosFixos ?? []).reduce(
    (acc, c) => acc + Number(c.valor),
    0
  );

  const overridesMap = new Map(
    (custosFixosMensaisOverrides ?? []).map((o) => [
      `${o.ano}-${o.mes}`,
      Number(o.valor),
    ])
  );

  const tabelaMensal = calcTabelaMensal(
    grupos ?? [],
    pagamentos ?? [],
    lancamentos ?? [],
    custosFixosMensais,
    overridesMap
  );

  const receitaTotal = tabelaMensal.reduce((acc, m) => acc + m.receita, 0);
  const gastoTotal = tabelaMensal.reduce((acc, m) => acc + m.gasto, 0);
  const lucroAcumulado = receitaTotal - gastoTotal;

  const valorClausulas = (pagamentos ?? [])
    .filter((p) => p.tipo === "CLAUSULA_CANCELAMENTO")
    .reduce((acc, p) => acc + Number(p.valor), 0);

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
          somado a receitas e despesas avulsas, mês a mês.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-bg-surface p-6">
        <p className="text-sm text-text-secondary">Lucro acumulado</p>
        <p
          className={`mt-2 font-display text-4xl font-bold tabular-nums ${
            lucroAcumulado >= 0 ? "text-text-primary" : "text-status-alert-text"
          }`}
        >
          {formatBRL(lucroAcumulado)}
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Receita total − gasto total, somando todos os meses
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Receita total" value={formatBRL(receitaTotal)} />
        <InfoCard label="Gasto total" value={formatBRL(gastoTotal)} />
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

      <section>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Por mês
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          Receita = mensalidades que venceram no mês (1 mês após a entrada de
          cada grupo, e a cada mês seguinte) + cláusulas recebidas + receitas
          avulsas. Gasto = custos fixos do mês (por padrão, o valor atual de{" "}
          {formatBRL(custosFixosMensais)} — editável por mês) + despesas
          avulsas lançadas no mês. Clique em um mês para ver a composição e
          editar.
        </p>
        <TabelaMensalFinancas
          meses={tabelaMensal}
          lancamentos={lancamentos ?? []}
          custosFixosAtual={custosFixosMensais}
        />
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Todos os lançamentos
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
