import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcFaturamentoEstimado } from "@/lib/format";
import { calcSaudeGrupo, calcTendenciaRoas } from "@/lib/saude";
import { GruposTable } from "@/components/GruposTable";
import { GruposResumo } from "@/components/GruposResumo";

const DIAS_SEM_SINAL_DE_VIDA = 30;

export default async function GruposPage() {
  const supabase = await createClient();

  const [
    { data: grupos },
    { data: reunioes },
    { data: participantes },
    { data: resultados },
    { data: processosAtivos },
    { data: entregas },
  ] = await Promise.all([
    supabase
      .from("grupos_gestao")
      .select("*")
      .order("status", { ascending: true })
      .order("nome", { ascending: true }),
    supabase.from("reunioes").select("id, grupo_id, data"),
    supabase
      .from("reuniao_participantes")
      .select("reuniao_id, mentorados(grupo_id)"),
    supabase
      .from("resultados_grupo")
      .select(
        "grupo_id, data, investimento, faturamento_campanha_interna, faturamento_trafego_pago"
      ),
    supabase.from("tipos_entrega").select("id").eq("ativo", true),
    supabase.from("entregas_grupo").select("grupo_id, tipo_entrega_id, feito"),
  ]);

  const faturamentoTotal = (grupos ?? []).reduce(
    (acc, g) =>
      acc +
      calcFaturamentoEstimado(
        Number(g.valor_mensal),
        g.data_inicio,
        g.data_termino
      ),
    0
  );

  type ParticipanteRow = { reuniao_id: string; mentorados: { grupo_id: string } | null };

  const gruposPorReuniao = new Map<string, Set<string>>();
  for (const r of reunioes ?? []) {
    gruposPorReuniao.set(r.id, new Set([r.grupo_id]));
  }
  for (const p of (participantes ?? []) as unknown as ParticipanteRow[]) {
    const grupoId = p.mentorados?.grupo_id;
    if (!grupoId) continue;
    gruposPorReuniao.get(p.reuniao_id)?.add(grupoId);
  }

  const ultimaReuniaoPorGrupo = new Map<string, string>();
  for (const r of reunioes ?? []) {
    const gruposEnvolvidos = gruposPorReuniao.get(r.id) ?? new Set([r.grupo_id]);
    for (const gid of gruposEnvolvidos) {
      const atual = ultimaReuniaoPorGrupo.get(gid);
      if (!atual || r.data > atual) {
        ultimaReuniaoPorGrupo.set(gid, r.data);
      }
    }
  }

  const hoje = new Date();
  const semSinalDeVida = (grupos ?? [])
    .filter((g) => g.status === "Ativo")
    .map((g) => {
      const ultima = ultimaReuniaoPorGrupo.get(g.id);
      const dias = ultima
        ? Math.floor(
            (hoje.getTime() - new Date(ultima + "T00:00:00").getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;
      return { id: g.id, nome: g.nome, dias };
    })
    .filter((g) => g.dias === null || g.dias > DIAS_SEM_SINAL_DE_VIDA)
    .sort((a, b) => (b.dias ?? Infinity) - (a.dias ?? Infinity));

  const ativos = (grupos ?? []).filter((g) => g.status === "Ativo");

  const totalProcessosAtivos = (processosAtivos ?? []).length;
  const idsProcessosAtivos = new Set((processosAtivos ?? []).map((p) => p.id));
  const feitosPorGrupo = new Map<string, Set<string>>();
  for (const e of entregas ?? []) {
    if (!idsProcessosAtivos.has(e.tipo_entrega_id) || !e.feito) continue;
    const feitos = feitosPorGrupo.get(e.grupo_id) ?? new Set();
    feitos.add(e.tipo_entrega_id);
    feitosPorGrupo.set(e.grupo_id, feitos);
  }

  const resultadosPorGrupo = new Map<
    string,
    { mes: string; investimento: number; faturamento: number }[]
  >();
  for (const r of resultados ?? []) {
    const lista = resultadosPorGrupo.get(r.grupo_id) ?? [];
    lista.push({
      mes: r.data.slice(0, 7),
      investimento: Number(r.investimento),
      faturamento:
        Number(r.faturamento_campanha_interna) +
        Number(r.faturamento_trafego_pago),
    });
    resultadosPorGrupo.set(r.grupo_id, lista);
  }
  // Agrupa lançamentos por mês antes de calcular tendência (senão vários
  // lançamentos no mesmo mês contam como "2 meses" indevidamente).
  function agregarPorMes(
    lancamentos: { mes: string; investimento: number; faturamento: number }[]
  ) {
    const m = new Map<string, { investimento: number; faturamento: number }>();
    for (const l of lancamentos) {
      const atual = m.get(l.mes) ?? { investimento: 0, faturamento: 0 };
      atual.investimento += l.investimento;
      atual.faturamento += l.faturamento;
      m.set(l.mes, atual);
    }
    return [...m.entries()].map(([mes, v]) => ({ mes, ...v }));
  }

  const saudeGrupos = ativos
    .map((g) => {
      const ultima = ultimaReuniaoPorGrupo.get(g.id);
      const diasSemReuniao = ultima
        ? Math.floor(
            (hoje.getTime() - new Date(ultima + "T00:00:00").getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;
      const tendenciaRoas = calcTendenciaRoas(
        agregarPorMes(resultadosPorGrupo.get(g.id) ?? [])
      );
      const processosIncompletos =
        totalProcessosAtivos - (feitosPorGrupo.get(g.id)?.size ?? 0);
      const { status, flags } = calcSaudeGrupo({
        diasSemReuniao,
        tendenciaRoas,
        processosIncompletos,
      });
      return { id: g.id, nome: g.nome, status, flags };
    })
    .sort((a, b) => {
      const ordem = { alert: 0, warn: 1, ok: 2 };
      return ordem[a.status] - ordem[b.status];
    });

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
          Grupos de gestão
        </h1>
        <Link
          href="/grupos/novo"
          prefetch={false}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          + Novo grupo
        </Link>
      </div>

      <GruposResumo
        faturamentoTotal={faturamentoTotal}
        ativosCount={ativos.length}
        totalCount={(grupos ?? []).length}
        semSinalDeVidaCount={semSinalDeVida.length}
        saudeGrupos={saudeGrupos}
      />

      <GruposTable grupos={grupos ?? []} />
    </div>
  );
}
