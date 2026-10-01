import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAvisos } from "@/lib/data/avisos";
import { displayGroupName, formatBRL, formatDate, formatMesAno, plural } from "@/lib/format";
import { formatDiaSemanaCurto, somarDias } from "@/lib/calendario";
import { AVISOS_VAZIOS, textoRenovacao, totalAvisos } from "@/lib/avisos";
import { PageHeader } from "@/components/ui/PageHeader";
import { AvisosPainel } from "@/components/AvisosPainel";
import { CobrarWhatsApp } from "@/components/CobrarWhatsApp";
import { BotaoNovoAgendamento } from "@/components/AgendamentoProvider";

// Página inicial: só reúne o que as outras telas já calculam (avisos,
// cobranças, renovações, resultados pendentes) e as reuniões da semana.
export default async function InicioPage() {
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const fimSemana = somarDias(hoje, 6);

  const [avisos, { data: reunioes }, { data: responsaveis }] = await Promise.all([
    getAvisos(),
    supabase
      .from("reunioes")
      .select("id, grupo_id, data, hora, compareceu, responsavel_id, grupos_gestao(nome)")
      .gte("data", hoje)
      .lte("data", fimSemana)
      .order("data", { ascending: true })
      .order("hora", { ascending: true, nullsFirst: false }),
    supabase.from("responsaveis").select("id, nome"),
  ]);

  const nomeResp = new Map((responsaveis ?? []).map((r) => [r.id, r.nome]));
  const daSemana = ((reunioes ?? []) as unknown as ReuniaoRow[]).filter((r) => r.compareceu);
  const deHoje = daSemana.filter((r) => r.data === hoje);
  const proximas = daSemana.filter((r) => r.data !== hoje);

  const totalAtraso = avisos.pagamento.reduce((acc, p) => acc + p.valor, 0);
  const outros = {
    ...AVISOS_VAZIOS,
    reuniao: avisos.reuniao,
    onboarding: avisos.onboarding,
    processos: avisos.processos,
  };

  const linha = (r: ReuniaoRow) => ({
    r,
    hoje,
    responsavel: r.responsavel_id ? (nomeResp.get(r.responsavel_id) ?? "") : "",
  });

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-10">
      <PageHeader
        titulo="Início"
        acoes={<BotaoNovoAgendamento />}
      >
        <p className="mt-1 text-sm text-muted">
          {totalAvisos(avisos) === 0
            ? "Nenhum aviso por enquanto."
            : `${plural(totalAvisos(avisos), "aviso", "avisos")} na central.`}
        </p>
      </PageHeader>

      <div className="grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
        <section className="flex flex-col">
          <h2 className="mb-1.5 text-[15px] font-semibold text-text">Reuniões de hoje</h2>
          {deHoje.length === 0 ? (
            <p className="py-2 text-sm text-muted">Nenhuma reunião hoje.</p>
          ) : (
            deHoje.map((r) => <LinhaReuniao key={r.id} {...linha(r)} />)
          )}
          <h2 className="mb-1.5 mt-6 text-[15px] font-semibold text-text">Próximos 7 dias</h2>
          {proximas.length === 0 ? (
            <p className="py-2 text-sm text-muted">Nenhuma reunião agendada.</p>
          ) : (
            proximas.map((r) => <LinhaReuniao key={r.id} {...linha(r)} />)
          )}
        </section>

        <section className="flex flex-col">
          <h2 className="mb-1.5 flex items-baseline justify-between text-[15px] font-semibold text-text">
            Cobranças atrasadas
            {avisos.pagamento.length > 0 && (
              <span className="text-[14px] font-medium tabular-nums text-danger">{formatBRL(totalAtraso)}</span>
            )}
          </h2>
          {avisos.pagamento.length === 0 ? (
            <p className="py-2 text-sm text-muted">Nenhum boleto atrasado.</p>
          ) : (
            avisos.pagamento.map((p) => (
              <div
                key={p.pagamentoId}
                className="flex items-baseline justify-between gap-3 border-b border-line-soft py-2.5 text-[14.5px] last:border-b-0"
              >
                <Link href={`/grupos/${p.grupoId}/pagamentos`} prefetch={false} className="min-w-0 truncate text-text hover:text-gold">
                  {p.grupoNome}
                  <span className="ml-2 text-[13px] tabular-nums text-danger">
                    {formatBRL(p.valor)} · {formatDate(p.vencimento).slice(0, 5)}
                  </span>
                </Link>
                <CobrarWhatsApp mentorados={p.mentorados} valor={p.valor} vencimento={p.vencimento} />
              </div>
            ))
          )}
        </section>

        <section className="flex flex-col">
          <h2 className="mb-1.5 text-[15px] font-semibold text-text">Renovações (próximos 30 dias)</h2>
          {avisos.renovacao.length === 0 ? (
            <p className="py-2 text-sm text-muted">Nenhum contrato terminando.</p>
          ) : (
            avisos.renovacao.map((r) => (
              <Link
                key={r.grupoId}
                href={`/grupos/${r.grupoId}`}
                prefetch={false}
                className="-mx-2 flex items-baseline justify-between gap-3 rounded-lg border-b border-line-soft px-2 py-2.5 text-[14.5px] last:border-b-0 hover:bg-hover"
              >
                <span className="text-text">{r.grupoNome}</span>
                <span className={`text-[13px] ${r.dias < 0 ? "text-danger" : "text-warn"}`}>
                  {textoRenovacao(r.dias)} · {formatDate(r.fim)}
                </span>
              </Link>
            ))
          )}
        </section>

        <section className="flex flex-col">
          <h2 className="mb-1.5 flex items-baseline justify-between text-[15px] font-semibold text-text">
            Resultados pendentes
            {avisos.resultados.length > 0 && (
              <Link href={`/resultados/lancar?mes=${avisos.resultados[0].mes}`} prefetch={false} className="link text-[13.5px] font-normal">
                Lançar resultados
              </Link>
            )}
          </h2>
          {avisos.resultados.length === 0 ? (
            <p className="py-2 text-sm text-muted">Tudo lançado no mês anterior.</p>
          ) : (
            <>
              <p className="pb-1 text-[13px] text-muted">
                Sem lançamento em{" "}
                {formatMesAno(
                  Number(avisos.resultados[0].mes.slice(0, 4)),
                  Number(avisos.resultados[0].mes.slice(5, 7))
                ).toLocaleLowerCase("pt-BR")}
                :
              </p>
              {avisos.resultados.map((r) => (
                <Link
                  key={r.grupoId}
                  href={`/grupos/${r.grupoId}/resultados`}
                  prefetch={false}
                  className="-mx-2 rounded-lg border-b border-line-soft px-2 py-2.5 text-[14.5px] text-text last:border-b-0 hover:bg-hover"
                >
                  {r.grupoNome}
                </Link>
              ))}
            </>
          )}
        </section>
      </div>

      {totalAvisos(outros) > 0 && (
        <section className="flex flex-col gap-2 border-t border-line pt-8">
          <h2 className="text-[15px] font-semibold text-text">Outros avisos</h2>
          <div className="-mx-3">
            <AvisosPainel avisos={outros} />
          </div>
        </section>
      )}
    </div>
  );
}

type ReuniaoRow = {
  id: string;
  grupo_id: string;
  data: string;
  hora: string | null;
  compareceu: boolean;
  responsavel_id: string | null;
  grupos_gestao: { nome: string } | null;
};

function LinhaReuniao({ r, hoje, responsavel }: { r: ReuniaoRow; hoje: string; responsavel: string }) {
  return (
    <Link
      href={`/grupos/${r.grupo_id}/reunioes`}
      prefetch={false}
      className="-mx-2 flex items-baseline justify-between gap-4 rounded-lg border-b border-line-soft px-2 py-2.5 text-[14.5px] last:border-b-0 hover:bg-hover"
    >
      <span className="flex min-w-0 items-baseline gap-3">
        <span className="w-24 shrink-0 tabular-nums text-text-2">
          {r.data === hoje ? (
            <span className="text-gold">Hoje</span>
          ) : (
            `${formatDiaSemanaCurto(r.data)} ${formatDate(r.data).slice(0, 5)}`
          )}
        </span>
        <span className="w-12 shrink-0 tabular-nums text-muted">{r.hora ? r.hora.slice(0, 5) : "—"}</span>
        <span className="truncate text-text">{displayGroupName(r.grupos_gestao?.nome)}</span>
      </span>
      <span className="shrink-0 text-[13px] text-muted">{responsavel}</span>
    </Link>
  );
}