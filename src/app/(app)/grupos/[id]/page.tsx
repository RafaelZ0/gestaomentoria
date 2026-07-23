import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatBRL,
  formatDate,
  calcDuracaoDias,
  calcFaturamentoEstimado,
  formatDuracao,
} from "@/lib/format";
import { resumoStatusMensalidades } from "@/lib/mensalidade";
import { CancelarGrupoButton } from "@/components/CancelarGrupoModal";
import { ChecklistEntregas } from "@/components/ChecklistEntregas";
import { MentoradosList } from "@/components/MentoradosList";
import { TrafegoCard } from "@/components/TrafegoCard";
import { ValorMensalCard } from "@/components/ValorMensalCard";
import { DataInicioField } from "@/components/DataInicioField";
import { ObservacoesField } from "@/components/ObservacoesField";
import { StatusBadge } from "@/components/StatusBadge";
import { getGrupo } from "@/lib/data/grupo";

export default async function GrupoOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: grupo },
    { data: mentorados },
    { data: entregas },
    { data: pagamentos },
    { data: tarefasPendentes },
    { data: ultimaReuniao },
    { data: resultados },
    { data: mensalidadesPagas },
  ] = await Promise.all([
    getGrupo(id).then((data) => ({ data })),
    supabase.from("mentorados").select("*").eq("grupo_id", id).order("nome"),
    supabase
      .from("entregas_grupo")
      .select("id, feito, data_feito, tipos_entrega(id, nome, ativo)")
      .eq("grupo_id", id),
    supabase.from("pagamentos").select("valor").eq("grupo_id", id),
    supabase
      .from("tarefas")
      .select("id")
      .eq("grupo_id", id)
      .eq("concluida", false),
    supabase
      .from("reunioes")
      .select("data")
      .eq("grupo_id", id)
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("resultados_grupo")
      .select(
        "data, investimento, leads, faturamento_campanha_interna, faturamento_trafego_pago"
      )
      .eq("grupo_id", id)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("mensalidade_paga").select("data_vencimento").eq("grupo_id", id),
  ]);

  if (!grupo) return null;

  const totaisResultados = (resultados ?? []).reduce(
    (acc, r) => ({
      investimento: acc.investimento + Number(r.investimento),
      faturamento:
        acc.faturamento +
        Number(r.faturamento_campanha_interna) +
        Number(r.faturamento_trafego_pago),
    }),
    { investimento: 0, faturamento: 0 }
  );
  const roas =
    totaisResultados.investimento > 0
      ? totaisResultados.faturamento / totaisResultados.investimento
      : null;

  const ultimoResultado = (resultados ?? [])[0] ?? null;
  const ultimoCpl =
    ultimoResultado && ultimoResultado.leads > 0
      ? Number(ultimoResultado.investimento) / ultimoResultado.leads
      : null;

  const pagasSet = new Set((mensalidadesPagas ?? []).map((m) => m.data_vencimento));
  const statusMensalidadeAtual = resumoStatusMensalidades(
    grupo.data_inicio,
    grupo.data_termino,
    pagasSet
  );
  const statusVariant =
    statusMensalidadeAtual === "Pago"
      ? "ok"
      : statusMensalidadeAtual === "Atrasado"
        ? "alert"
        : "warn";

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

  const diasDesdeUltimaReuniao = ultimaReuniao
    ? calcDuracaoDias(ultimaReuniao.data, null)
    : null;

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
        <ValorMensalCard grupoId={grupo.id} valorMensal={Number(grupo.valor_mensal)} />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard label="ROAS" value={roas === null ? "—" : `${roas.toFixed(1)}x`} />
        <InfoCard
          label="Último CPL"
          value={ultimoCpl === null ? "—" : formatBRL(ultimoCpl)}
        />
        <div className="rounded-xl border border-border bg-bg-surface p-5">
          <p className="text-sm text-text-secondary">Mensalidade</p>
          <div className="mt-2">
            {statusMensalidadeAtual ? (
              <StatusBadge label={statusMensalidadeAtual} variant={statusVariant} />
            ) : (
              <span className="text-text-secondary">—</span>
            )}
          </div>
        </div>
      </div>

      <div className="text-sm text-text-secondary">
        <DataInicioField grupoId={grupo.id} dataInicio={grupo.data_inicio} />
        {grupo.data_termino && <> · Encerrado em {formatDate(grupo.data_termino)}</>}
        {recebidoRegistrado > 0 && (
          <> · {formatBRL(recebidoRegistrado)} recebido em pagamentos registrados</>
        )}
      </div>

      <ObservacoesField grupoId={grupo.id} observacoes={grupo.observacoes} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href={`/grupos/${grupo.id}/tarefas`}
          prefetch={false}
          className="rounded-lg border border-border bg-bg-surface-hover px-4 py-3 text-sm hover:bg-bg-surface"
        >
          <span className="text-text-secondary">Tarefas pendentes</span>{" "}
          <span className="font-medium text-text-primary">
            {(tarefasPendentes ?? []).length}
          </span>
        </Link>
        <Link
          href={`/grupos/${grupo.id}/reunioes`}
          prefetch={false}
          className="rounded-lg border border-border bg-bg-surface-hover px-4 py-3 text-sm hover:bg-bg-surface"
        >
          <span className="text-text-secondary">Última reunião</span>{" "}
          <span className="font-medium text-text-primary">
            {diasDesdeUltimaReuniao === null
              ? "nunca teve reunião"
              : diasDesdeUltimaReuniao === 0
                ? "hoje"
                : `${diasDesdeUltimaReuniao} dias atrás`}
          </span>
        </Link>
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

      <section className="mt-10 rounded-xl border border-status-alert-text/20 bg-status-alert-bg/40 p-5">
        <h2 className="font-display text-sm font-semibold text-status-alert-text">
          Zona de risco
        </h2>
        <p className="mt-1 text-xs text-text-secondary">
          Cancelar o grupo marca o contrato como encerrado e pode gerar uma
          cobrança de cláusula. Essa ação pede confirmação antes de ser
          aplicada.
        </p>
        <div className="mt-3">
          <CancelarGrupoButton
            grupoId={grupo.id}
            status={grupo.status}
            valorMensal={Number(grupo.valor_mensal)}
          />
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-xl font-semibold tracking-tight tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}
