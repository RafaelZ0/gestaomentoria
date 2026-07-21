import { createClient } from "@/lib/supabase/server";
import {
  formatBRL,
  formatDate,
  calcDuracaoDias,
  calcFaturamentoEstimado,
  formatDuracao,
} from "@/lib/format";
import { EditarGrupoForm } from "@/components/EditarGrupoForm";
import { CancelarGrupoButton } from "@/components/CancelarGrupoModal";
import { ChecklistEntregas } from "@/components/ChecklistEntregas";
import { MentoradosList } from "@/components/MentoradosList";
import { TrafegoCard } from "@/components/TrafegoCard";

export default async function GrupoOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: grupo }, { data: mentorados }, { data: entregas }, { data: pagamentos }] =
    await Promise.all([
      supabase.from("grupos_gestao").select("*").eq("id", id).single(),
      supabase.from("mentorados").select("*").eq("grupo_id", id).order("nome"),
      supabase
        .from("entregas_grupo")
        .select("id, feito, data_feito, tipos_entrega(id, nome, ativo)")
        .eq("grupo_id", id),
      supabase.from("pagamentos").select("*").eq("grupo_id", id),
    ]);

  if (!grupo) return null;

  const recebidoRegistrado = (pagamentos ?? []).reduce(
    (acc, p) => acc + Number(p.valor),
    0
  );

  const duracaoDias = calcDuracaoDias(grupo.data_inicio, grupo.data_termino);
  const faturamentoEstimado = calcFaturamentoEstimado(
    Number(grupo.valor_mensal),
    grupo.data_inicio,
    grupo.data_termino
  );

  type EntregaRow = {
    id: string;
    feito: boolean;
    data_feito: string | null;
    tipos_entrega: { id: string; nome: string; ativo: boolean } | null;
  };

  const entregasAtivas = ((entregas ?? []) as unknown as EntregaRow[])
    .filter((e) => e.tipos_entrega?.ativo)
    .map((e) => ({
      id: e.id,
      nome: e.tipos_entrega!.nome,
      feito: e.feito,
      data_feito: e.data_feito,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <InfoCard label="Valor mensal" value={formatBRL(Number(grupo.valor_mensal))} />
        <InfoCard
          label="Faturamento estimado"
          value={formatBRL(faturamentoEstimado)}
        />
        <InfoCard label="Duração" value={formatDuracao(duracaoDias)} />
        <TrafegoCard
          grupoId={grupo.id}
          trafegoPago={grupo.trafego_pago}
          trafegoPagoDesde={grupo.trafego_pago_desde}
          valorInvestidoDia={
            grupo.valor_investido_dia !== null
              ? Number(grupo.valor_investido_dia)
              : null
          }
        />
      </div>

      <div className="text-sm text-text-secondary">
        Início em {formatDate(grupo.data_inicio)}
        {grupo.data_termino && <> · Encerrado em {formatDate(grupo.data_termino)}</>}
        {recebidoRegistrado > 0 && (
          <> · {formatBRL(recebidoRegistrado)} recebido em pagamentos registrados</>
        )}
      </div>

      {grupo.observacoes && (
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <p className="text-sm text-text-secondary">Observações</p>
          <p className="mt-1 text-sm text-text-primary">{grupo.observacoes}</p>
        </div>
      )}

      <div className="flex gap-2">
        <EditarGrupoForm grupo={grupo} />
        <CancelarGrupoButton
          grupoId={grupo.id}
          status={grupo.status}
          valorMensal={Number(grupo.valor_mensal)}
        />
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Mentorados
        </h2>
        <div className="mt-3">
          <MentoradosList grupoId={grupo.id} mentorados={mentorados ?? []} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Checklist de entregas
        </h2>
        <div className="mt-3">
          <ChecklistEntregas grupoId={grupo.id} entregas={entregasAtivas} />
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}
