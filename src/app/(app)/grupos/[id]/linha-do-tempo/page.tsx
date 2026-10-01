import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGrupo } from "@/lib/data/grupo";
import { displayProcessName, formatBRL, formatDate, formatMesAno } from "@/lib/format";
import { Icon, type NomeIcone } from "@/components/ui/Icon";

type Evento = {
  chave: string;
  data: string;
  icone: NomeIcone;
  titulo: string;
  detalhe?: string;
  tom?: "danger" | "muted";
  href: string;
};

// Linha do tempo do grupo (só leitura): reuniões, pagamentos, lançamentos
// de resultado, entregas do checklist e onboarding, do mais recente pro
// mais antigo. Eventos futuros (reunião só agendada, boleto a vencer) não
// entram: aqui é o que já aconteceu.
export default async function LinhaDoTempoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const base = `/grupos/${id}`;

  const [grupo, { data: reunioes }, { data: participacoes }, { data: pagamentos }, { data: resultados }, { data: entregas }, { data: onboardings }] =
    await Promise.all([
      getGrupo(id),
      supabase.from("reunioes").select("id, data, hora, resumo, compareceu").eq("grupo_id", id).lte("data", hoje),
      supabase.from("reuniao_participantes").select("reuniao_id, mentorados!inner(grupo_id)").eq("mentorados.grupo_id", id),
      supabase.from("pagamentos").select("id, data, valor, status, tipo").eq("grupo_id", id).lte("data", hoje),
      supabase.from("resultados_grupo").select("id, data, investimento, leads, vendas_campanha_interna, vendas_trafego_pago, faturamento_campanha_interna, faturamento_trafego_pago").eq("grupo_id", id),
      supabase.from("entregas_grupo").select("id, data_feito, feito, tipos_entrega(nome)").eq("grupo_id", id).eq("feito", true),
      supabase.from("onboardings").select("id, status, respostas, created_at").eq("grupo_id", id),
    ]);

  // Reuniões de outros grupos em que um mentorado deste participou.
  const idsProprias = new Set((reunioes ?? []).map((r) => r.id));
  const idsConvidado = [
    ...new Set(
      ((participacoes ?? []) as unknown as { reuniao_id: string }[])
        .map((p) => p.reuniao_id)
        .filter((rid) => !idsProprias.has(rid))
    ),
  ];
  const { data: reunioesConvidado } =
    idsConvidado.length > 0
      ? await supabase
          .from("reunioes")
          .select("id, data, hora, resumo, compareceu, grupos_gestao(nome)")
          .in("id", idsConvidado)
          .lte("data", hoje)
      : { data: [] };

  const eventos: Evento[] = [];

  if (grupo) {
    eventos.push({
      chave: "inicio",
      data: grupo.data_inicio,
      icone: "grupos",
      titulo: "Início do contrato",
      href: base,
    });
    if (grupo.data_termino) {
      eventos.push({ chave: "fim", data: grupo.data_termino, icone: "grupos", titulo: "Contrato encerrado", tom: "muted", href: base });
    }
  }

  for (const r of reunioes ?? []) {
    eventos.push({
      chave: `r-${r.id}`,
      data: r.data,
      icone: "reunioes",
      titulo: `Reunião${r.hora ? ` às ${r.hora.slice(0, 5)}` : ""}${r.compareceu ? "" : " · não compareceu"}`,
      detalhe: r.resumo || undefined,
      tom: r.compareceu ? undefined : "danger",
      href: `${base}/reunioes`,
    });
  }
  for (const r of (reunioesConvidado ?? []) as unknown as {
    id: string;
    data: string;
    hora: string | null;
    resumo: string;
    grupos_gestao: { nome: string } | null;
  }[]) {
    eventos.push({
      chave: `rc-${r.id}`,
      data: r.data,
      icone: "reunioes",
      titulo: "Reunião como convidado",
      detalhe: r.resumo || undefined,
      href: `${base}/reunioes`,
    });
  }

  for (const p of pagamentos ?? []) {
    const pago = p.status === "PAGO";
    eventos.push({
      chave: `p-${p.id}`,
      data: p.data,
      icone: "pagamento",
      titulo: pago
        ? `Pagamento de ${formatBRL(Number(p.valor))}${p.tipo === "CLAUSULA_CANCELAMENTO" ? " (cláusula de cancelamento)" : ""}`
        : `Boleto de ${formatBRL(Number(p.valor))} venceu sem pagamento`,
      tom: pago ? undefined : "danger",
      href: `${base}/pagamentos`,
    });
  }

  for (const r of resultados ?? []) {
    const vendas = r.vendas_campanha_interna + r.vendas_trafego_pago;
    const fat = Number(r.faturamento_campanha_interna) + Number(r.faturamento_trafego_pago);
    const [ano, mes] = r.data.split("-").map(Number);
    eventos.push({
      chave: `res-${r.id}`,
      data: r.data,
      icone: "resultados",
      titulo: `Resultados de ${formatMesAno(ano, mes).toLocaleLowerCase("pt-BR")}`,
      detalhe: `${formatBRL(Number(r.investimento))} investidos · ${r.leads} leads · ${vendas} vendas · ${formatBRL(fat)} faturados`,
      href: `${base}/resultados`,
    });
  }

  for (const e of (entregas ?? []) as unknown as { id: string; data_feito: string | null; tipos_entrega: { nome: string } | null }[]) {
    if (!e.data_feito) continue;
    eventos.push({
      chave: `e-${e.id}`,
      data: e.data_feito,
      icone: "check",
      titulo: `Entrega: ${displayProcessName(e.tipos_entrega?.nome)}`,
      href: base,
    });
  }

  for (const o of onboardings ?? []) {
    const respostas = (o.respostas ?? {}) as Record<string, unknown>;
    const dataDiag = typeof respostas.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(respostas.data)
      ? respostas.data
      : o.created_at.slice(0, 10);
    eventos.push({
      chave: `o-${o.id}`,
      data: dataDiag,
      icone: "processos",
      titulo: o.status === "concluido" ? "Diagnóstico de onboarding concluído" : "Diagnóstico de onboarding iniciado",
      href: `${base}/onboarding`,
    });
  }

  eventos.sort((a, b) => b.data.localeCompare(a.data) || a.chave.localeCompare(b.chave));

  return (
    <div className="flex flex-col">
      {eventos.length === 0 ? (
        <p className="py-6 text-sm text-muted">Nada registrado ainda.</p>
      ) : (
        <ol className="relative flex flex-col">
          {eventos.map((ev) => (
            <li key={ev.chave} className="relative flex gap-4 pb-1">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface ${
                    ev.tom === "danger" ? "text-danger" : "text-text-2"
                  }`}
                >
                  <Icon nome={ev.icone} tamanho={15} />
                </span>
                <span className="w-px flex-1 bg-line" />
              </div>
              <Link
                href={ev.href}
                prefetch={false}
                className="-mt-0.5 mb-3 min-w-0 flex-1 rounded-lg px-2 py-1.5 hover:bg-hover"
              >
                <span className="text-[13px] tabular-nums text-muted">{formatDate(ev.data)}</span>
                <p
                  className={`text-[14.5px] ${
                    ev.tom === "danger" ? "text-danger" : ev.tom === "muted" ? "text-muted" : "text-text"
                  }`}
                >
                  {ev.titulo}
                </p>
                {ev.detalhe && (
                  <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-[13.5px] text-text-2">{ev.detalhe}</p>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
