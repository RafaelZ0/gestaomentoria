import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";
import { CustosFixosList } from "@/components/CustosFixosList";
import { CustoHoraConfigForm } from "@/components/CustoHoraConfigForm";

export default async function CustoHoraPage() {
  const supabase = await createClient();

  const [{ data: custos }, { data: config }] = await Promise.all([
    supabase.from("custos_fixos").select("*").order("nome"),
    supabase.from("custo_hora_config").select("*").eq("id", 1).single(),
  ]);

  const totalCustosFixos = (custos ?? []).reduce(
    (acc, c) => acc + Number(c.valor),
    0
  );

  const horasAtendimento = Number(config?.horas_atendimento_mes ?? 0);
  const percentualOciosidade = Number(config?.percentual_ociosidade ?? 0);
  const percentualFatorAvaliacao = Number(
    config?.percentual_fator_avaliacao ?? 0
  );

  const horasUteis = horasAtendimento * (1 - percentualOciosidade / 100);
  const custoHora = horasUteis > 0 ? totalCustosFixos / horasUteis : 0;
  const custoHoraFinal = custoHora * (1 + percentualFatorAvaliacao / 100);
  const custoPorMinuto = custoHoraFinal / 60;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          Custo Hora
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Compare com o valor mensal cobrado dos grupos de gestão para ver se
          o preço cobre o custo real do seu tempo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResultCard label="Custo hora" value={formatBRL(custoHora)} />
        <ResultCard
          label="Custo hora + fator de avaliação"
          value={formatBRL(custoHoraFinal)}
        />
        <ResultCard label="Custo por minuto" value={formatBRL(custoPorMinuto)} />
      </div>

      {horasUteis <= 0 && (
        <div className="rounded-lg bg-status-warn-bg px-3 py-2 text-sm text-status-warn-text">
          Defina horas de atendimento por mês (acima de 0%) para calcular o
          custo hora.
        </div>
      )}

      <section>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Parâmetros
        </h2>
        <div className="mt-3">
          <CustoHoraConfigForm
            config={
              config ?? {
                id: 1,
                horas_atendimento_mes: 0,
                percentual_ociosidade: 20,
                percentual_fator_avaliacao: 15,
              }
            }
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
      <p className="mt-2 font-display text-4xl font-bold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}
