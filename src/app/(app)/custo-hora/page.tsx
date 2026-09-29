import { createClient } from "@/lib/supabase/server";
import { formatBRL } from "@/lib/format";
import { CustosFixosList } from "@/components/CustosFixosList";
import { CustoHoraConfigForm } from "@/components/CustoHoraConfigForm";
import { AjudaPopover, PageHeader } from "@/components/ui/PageHeader";
import { Metric } from "@/components/ui/Metric";

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
    <div className="mx-auto flex max-w-[960px] flex-col gap-9">
      <PageHeader
        titulo="Custo por grupo"
        ajuda={
          <p>
            Quanto cada grupo ativo custa em overhead (custos fixos divididos pelos grupos
            ativos), comparado com o valor médio que você cobra.
          </p>
        }
      />

      <div className="flex flex-col gap-4 border-b border-line pb-7">
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-3">
          <Metric rotulo="Custo por grupo" tamanho="lg">
            {formatBRL(custoPorGrupo)}
          </Metric>
          <Metric rotulo="Custo por grupo + margem" tamanho="lg">
            {formatBRL(custoPorGrupoComMargem)}
          </Metric>
          <Metric rotulo="Valor médio cobrado" tamanho="lg">
            {formatBRL(valorMedioCobrado)}
          </Metric>
        </div>

        <p className={`text-[14px] ${margemPorGrupo >= 0 ? "text-text-2" : "text-danger"}`}>
          Margem média por grupo: {formatBRL(margemPorGrupo)}
          {gruposAtivos.length > 0 && (
            <span className={margemPorGrupo >= 0 ? "text-muted" : ""}>
              {" "}
              · {gruposAtivos.length} grupo{gruposAtivos.length === 1 ? "" : "s"} ativo
              {gruposAtivos.length === 1 ? "" : "s"}
            </span>
          )}
        </p>

        {gruposAtivos.length === 0 && (
          <p className="text-[14px] text-warn">
            Nenhum grupo ativo no momento — não dá para calcular o custo por grupo.
          </p>
        )}
      </div>

      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold text-text">Parâmetros</h2>
          <AjudaPopover>
            <p>
              Margem de segurança somada ao custo por grupo, para saber o preço mínimo
              recomendado ao fechar um novo cliente.
            </p>
          </AjudaPopover>
        </div>
        <CustoHoraConfigForm config={config ?? { id: 1, percentual_fator_avaliacao: 15 }} />
      </section>

      <section className="flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold text-text">Custos fixos</h2>
        <CustosFixosList custos={custos ?? []} />
      </section>
    </div>
  );
}