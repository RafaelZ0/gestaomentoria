import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBRL, formatDate, calcDuracaoDias, formatDuracao, plural } from "@/lib/format";
import { ChecklistEntregas } from "@/components/ChecklistEntregas";
import { MentoradosList } from "@/components/MentoradosList";
import { EditarGrupoForm } from "@/components/EditarGrupoForm";
import { RaioXResumoCard } from "@/components/onboarding/RaioXResumoCard";
import { LinhaInfo, Metric } from "@/components/ui/Metric";
import { StatusDot, sentenceCase, tomTrafego } from "@/components/ui/StatusDot";
import { getGrupo, getSaudeGrupo } from "@/lib/data/grupo";

function formatRoas(v: number) {
  return `${v.toFixed(1)}x`;
}

export default async function GrupoOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editar?: string }>;
}) {
  const { id } = await params;
  const { editar } = await searchParams;
  const supabase = await createClient();
  const hojeISO = new Date().toISOString().slice(0, 10);

  const [
    grupo,
    saude,
    { data: mentorados },
    { data: entregas },
    { data: pagamentos },
    { data: tarefasPendentes },
    { data: resultados },
    { data: proximaReuniao },
    { data: onboarding },
  ] = await Promise.all([
    getGrupo(id),
    getSaudeGrupo(id),
    supabase.from("mentorados").select("*").eq("grupo_id", id).order("nome"),
    supabase
      .from("entregas_grupo")
      .select("id, feito, data_feito, tipos_entrega(id, nome, ativo)")
      .eq("grupo_id", id),
    supabase
      .from("pagamentos")
      .select("data, valor, status")
      .eq("grupo_id", id)
      .order("data", { ascending: false }),
    supabase.from("tarefas").select("id").eq("grupo_id", id).eq("concluida", false),
    supabase
      .from("resultados_grupo")
      .select("data, investimento, leads, faturamento_campanha_interna, faturamento_trafego_pago")
      .eq("grupo_id", id)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("reunioes")
      .select("data, hora, link_reuniao")
      .eq("grupo_id", id)
      .eq("compareceu", true)
      .gt("data", hojeISO)
      .order("data", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("onboardings")
      .select("*")
      .eq("grupo_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
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

  const pagamentosPagos = (pagamentos ?? []).filter((p) => p.status === "PAGO");
  const recebidoRegistrado = pagamentosPagos.reduce((acc, p) => acc + Number(p.valor), 0);
  const ultimoPagamento = pagamentosPagos[0] ?? null;
  const emAtraso = (pagamentos ?? [])
    .filter((p) => p.status === "PENDENTE" && p.data < hojeISO)
    .reduce((acc, p) => acc + Number(p.valor), 0);

  const duracaoDias = calcDuracaoDias(grupo.data_inicio, grupo.data_termino);
  const diasDesdeUltimaReuniao = saude.diasSemReuniao;

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

  const metaRoas = grupo.meta_roas !== null ? Number(grupo.meta_roas) : null;
  const metaCpl = grupo.meta_cpl !== null ? Number(grupo.meta_cpl) : null;

  const base = `/grupos/${grupo.id}`;

  return (
    <div className="flex flex-col gap-8">
      <RaioXResumoCard grupoId={grupo.id} onboarding={onboarding} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ResumoLink
          href={`${base}/reunioes`}
          rotulo="Próxima reunião"
          valor={
            proximaReuniao
              ? `${formatDate(proximaReuniao.data)}${proximaReuniao.hora ? ` às ${proximaReuniao.hora.slice(0, 5)}` : ""}`
              : "Não agendada"
          }
        />
        <ResumoLink
          href={`${base}/reunioes`}
          rotulo="Última reunião"
          valor={
            diasDesdeUltimaReuniao === null
              ? "Nunca teve reunião"
              : diasDesdeUltimaReuniao === 0
                ? "Hoje"
                : `${plural(diasDesdeUltimaReuniao, "dia", "dias")} atrás`
          }
        />
        <ResumoLink
          href={`${base}/tarefas`}
          rotulo="Tarefas pendentes"
          valor={String((tarefasPendentes ?? []).length)}
        />
      </div>

      {editar ? (
        <EditarGrupoForm
          grupoId={grupo.id}
          inicial={{
            nome: grupo.nome,
            valor_mensal: String(Number(grupo.valor_mensal)),
            data_inicio: grupo.data_inicio,
            data_fim_contrato: grupo.data_fim_contrato ?? "",
            observacoes: grupo.observacoes ?? "",
            trafego_pago: grupo.trafego_pago ?? "",
            trafego_pago_desde: grupo.trafego_pago_desde ?? "",
            valor_investido_dia:
              grupo.valor_investido_dia !== null ? String(Number(grupo.valor_investido_dia)) : "",
            meta_roas: metaRoas !== null ? String(metaRoas) : "",
            meta_cpl: metaCpl !== null ? String(metaCpl) : "",
          }}
        />
      ) : (
        <>
          <section className="flex flex-col gap-[18px]">
            <h2 className="text-[15px] font-semibold text-text">Contrato e pagamentos</h2>
            <div className="grid grid-cols-2 gap-6 border-b border-line pb-6 lg:grid-cols-4">
              <Metric rotulo="Valor mensal">{formatBRL(Number(grupo.valor_mensal))}</Metric>
              <Metric rotulo="Total pago">
                <Link href={`${base}/pagamentos`} prefetch={false} className="hover:text-gold">
                  {formatBRL(recebidoRegistrado)}
                </Link>
              </Metric>
              <Metric rotulo="Em atraso" tom={emAtraso > 0 ? "danger" : undefined}>
                <Link href={`${base}/pagamentos`} prefetch={false} className="hover:opacity-80">
                  {formatBRL(emAtraso)}
                </Link>
              </Metric>
              <Metric rotulo="Duração">{formatDuracao(duracaoDias)}</Metric>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
            <section className="flex flex-col">
              <h2 className="mb-1.5 text-[15px] font-semibold text-text">Tráfego pago</h2>
              <LinhaInfo rotulo="Status">
                {grupo.trafego_pago ? (
                  <StatusDot tom={tomTrafego(grupo.trafego_pago)}>
                    <span className="text-text">{sentenceCase(grupo.trafego_pago)}</span>
                  </StatusDot>
                ) : (
                  "—"
                )}
              </LinhaInfo>
              <LinhaInfo rotulo="Ativo desde">
                {grupo.trafego_pago_desde ? formatDate(grupo.trafego_pago_desde) : "—"}
              </LinhaInfo>
              <LinhaInfo rotulo="Investimento por dia">
                {grupo.valor_investido_dia !== null
                  ? formatBRL(Number(grupo.valor_investido_dia))
                  : "—"}
              </LinhaInfo>
              <LinhaInfo rotulo="ROAS">
                <ValorComMeta
                  realizado={roas}
                  meta={metaRoas}
                  formatar={formatRoas}
                  melhorQuandoMaior
                  editarHref={`${base}?editar=1`}
                />
              </LinhaInfo>
              <LinhaInfo rotulo="Último CPL">
                <ValorComMeta
                  realizado={ultimoCpl}
                  meta={metaCpl}
                  formatar={formatBRL}
                  melhorQuandoMaior={false}
                  editarHref={`${base}?editar=1`}
                />
              </LinhaInfo>
            </section>

            <section className="flex flex-col">
              <h2 className="mb-1.5 text-[15px] font-semibold text-text">Cadastro</h2>
              <LinhaInfo rotulo="Início do contrato">{formatDate(grupo.data_inicio)}</LinhaInfo>
              <LinhaInfo rotulo="Fim do contrato">
                {grupo.data_fim_contrato ? (
                  formatDate(grupo.data_fim_contrato)
                ) : (
                  <Link href={`${base}?editar=1`} prefetch={false} className="link">
                    Definir
                  </Link>
                )}
              </LinhaInfo>
              {grupo.data_termino && (
                <LinhaInfo rotulo="Encerrado em">{formatDate(grupo.data_termino)}</LinhaInfo>
              )}
              <LinhaInfo rotulo="Último pagamento">
                {ultimoPagamento ? (
                  <Link href={`${base}/pagamentos`} prefetch={false} className="hover:text-gold">
                    {formatBRL(Number(ultimoPagamento.valor))} em {formatDate(ultimoPagamento.data)}
                  </Link>
                ) : (
                  "Nenhum registrado"
                )}
              </LinhaInfo>
              <LinhaInfo rotulo="Observações" empilhado>
                {grupo.observacoes || <span className="text-muted">Sem observações</span>}
              </LinhaInfo>
            </section>
          </div>
        </>
      )}

      <MentoradosList grupoId={grupo.id} mentorados={mentorados ?? []} />

      <ChecklistEntregas grupoId={grupo.id} entregas={entregasAtivas} />
    </div>
  );
}

function ResumoLink({ href, rotulo, valor }: { href: string; rotulo: string; valor: string }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="group -mx-2 flex flex-col gap-1 rounded-lg px-2 py-1 hover:bg-hover"
    >
      <span className="text-[13px] text-muted">{rotulo}</span>
      <span className="text-[15px] text-text">{valor}</span>
    </Link>
  );
}

function ValorComMeta({
  realizado,
  meta,
  formatar,
  melhorQuandoMaior,
  editarHref,
}: {
  realizado: number | null;
  meta: number | null;
  formatar: (v: number) => string;
  melhorQuandoMaior: boolean;
  editarHref: string;
}) {
  if (meta === null || meta <= 0) {
    return (
      <>
        {realizado === null ? "—" : formatar(realizado)}{" "}
        <span className="text-subtle">·</span>{" "}
        <Link href={editarHref} prefetch={false} className="link">
          Definir meta
        </Link>
      </>
    );
  }

  const dentro =
    realizado !== null ? (melhorQuandoMaior ? realizado >= meta : realizado <= meta) : null;
  // Progresso até a meta: ROAS = realizado ÷ meta; CPL (menor é melhor) =
  // meta ÷ realizado. Calculado na hora, nunca gravado.
  const progresso =
    realizado === null || realizado <= 0
      ? 0
      : Math.min(1, melhorQuandoMaior ? realizado / meta : meta / realizado);

  return (
    <span className="inline-flex flex-col items-end gap-1.5">
      <span>
        {realizado === null ? "—" : formatar(realizado)}{" "}
        <span className="text-muted">· meta {formatar(meta)}</span>
        {dentro !== null && (
          <span className={dentro ? "text-ok" : "text-danger"}> · {dentro ? "dentro" : "fora"}</span>
        )}
      </span>
      <span
        className="block h-1 w-36 overflow-hidden rounded-full bg-raised"
        role="progressbar"
        aria-valuenow={Math.round(progresso * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso até a meta"
      >
        <span
          className={`block h-full rounded-full ${dentro ? "bg-ok" : "bg-gold"}`}
          style={{ width: `${Math.round(progresso * 100)}%` }}
        />
      </span>
    </span>
  );
}
