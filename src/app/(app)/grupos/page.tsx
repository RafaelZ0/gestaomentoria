import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcFaturamentoEstimado, formatBRL } from "@/lib/format";
import { GruposTable } from "@/components/GruposTable";
import { SemSinalDeVidaCard } from "@/components/SemSinalDeVidaCard";

const DIAS_SEM_SINAL_DE_VIDA = 30;

export default async function GruposPage() {
  const supabase = await createClient();

  const [{ data: grupos }, { data: reunioes }, { data: participantes }] =
    await Promise.all([
      supabase
        .from("grupos_gestao")
        .select("*")
        .order("status", { ascending: true })
        .order("nome", { ascending: true }),
      supabase.from("reunioes").select("id, grupo_id, data"),
      supabase
        .from("reuniao_participantes")
        .select("reuniao_id, mentorados(grupo_id)"),
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

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
          Grupos de gestão
        </h1>
        <Link
          href="/grupos/novo"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          + Novo grupo
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-hero rounded-xl border border-border bg-bg-surface p-6 sm:col-span-1">
          <p className="text-sm text-text-secondary">Faturamento total (estimado)</p>
          <p className="mt-2 font-display text-4xl font-bold tracking-tight tabular-nums text-text-primary">
            {formatBRL(faturamentoTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-6">
          <p className="text-sm text-text-secondary">Grupos ativos</p>
          <p className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums text-text-primary">
            {ativos.length}{" "}
            <span className="text-base font-normal text-text-secondary">
              / {(grupos ?? []).length}
            </span>
          </p>
        </div>
        <SemSinalDeVidaCard
          dias={DIAS_SEM_SINAL_DE_VIDA}
          grupos={semSinalDeVida}
        />
      </div>

      <GruposTable grupos={grupos ?? []} />
    </div>
  );
}
