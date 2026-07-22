import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";
import { CustosFixosList } from "@/components/CustosFixosList";
import { CustoHoraConfigForm } from "@/components/CustoHoraConfigForm";

export default async function CustoHoraPage() {
  const supabase = await createClient();

  const [{ data: custos }, { data: config }, { data: grupos }] =
    await Promise.all([
      supabase.from("custos_fixos").select("*").order("nome"),
      supabase.from("custo_hora_config").select("*").eq("id", 1).single(),
      supabase.from("grupos_gestao").select("valor_mensal").eq("status", "Ativo"),
    ]);

  const totalCustosFixos = (custos ?? []).reduce(
    (acc, c) => acc + Number(c.valor),
    0
  );

  const gruposAtivos = grupos ?? [];
  const percentualFatorAvaliacao = Number(
    config?.percentual_fator_avaliacao ?? 0
  );

  const custoPorGrupo =
    gruposAtivos.length > 0 ? totalCustosFixos / gruposAtivos.length : 0;
  const custoPorGrupoComMargem =
    custoPorGrupo * (1 + percentualFatorAvaliacao / 100);

  const valorMedioCobrado =
    gruposAtivos.length > 0
      ? gruposAtivos.reduce((acc, g) => acc + Number(g.valor_mensal), 0) /
        gruposAtivos.length
      : 0;

  const margemPorGrupo = valorMedioCobrado - custoPorGrupo;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
          Custo por grupo
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Quanto cada grupo ativo custa em overhead (custos fixos divididos
          pelos grupos ativos), comparado com o valor médio que você cobra.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResultCard label="Custo por grupo" value={formatBRL(custoPorGrupo)} />
        <ResultCard
          label="Custo por grupo + margem"
          value={formatBRL(custoPorGrupoComMargem)}
        />
        <ResultCard
          label="Valor médio cobrado"
          value={formatBRL(valorMedioCobrado)}
        />
      </div>

      <div
        className={`rounded-lg px-3 py-2 text-sm ${
          margemPorGrupo >= 0
            ? "bg-status-ok-bg text-status-ok-text"
            : "bg-status-alert-bg text-status-alert-text"
        }`}
      >
        Margem média por grupo: {formatBRL(margemPorGrupo)}
        {gruposAtivos.length > 0 && (
          <> · {gruposAtivos.length} grupo{gruposAtivos.length === 1 ? "" : "s"} ativo{gruposAtivos.length === 1 ? "" : "s"}</>
        )}
      </div>

      {gruposAtivos.length === 0 && (
        <div className="rounded-lg bg-status-warn-bg px-3 py-2 text-sm text-status-warn-text">
          Nenhum grupo ativo no momento — não dá para calcular o custo por
          grupo.
        </div>
      )}

      <section>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Parâmetros
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          Margem de segurança somada ao custo por grupo, para saber o preço
          mínimo recomendado ao fechar um novo cliente.
        </p>
        <div className="mt-3">
          <CustoHoraConfigForm
            config={config ?? { id: 1, percentual_fator_avaliacao: 15 }}
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Custos fixos
        </h2>
        <div className="mt-3">
          <CustosFixosList custos={custos ?? []} />
        </div>
      </section>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}
