import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcFaturamentoEstimado, formatBRL } from "@/lib/format";
import { GruposTable } from "@/components/GruposTable";

const DIAS_SEM_SINAL_DE_VIDA = 30;

export default async function GruposPage() {
  const supabase = await createClient();

  const [{ data: grupos }, { data: reunioes }] = await Promise.all([
    supabase
      .from("grupos_gestao")
      .select("*")
      .order("status", { ascending: true })
      .order("nome", { ascending: true }),
    supabase
      .from("reunioes")
      .select("*")
      .order("data", { ascending: false }),
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

  const ultimaReuniaoPorGrupo = new Map<string, string>();
  for (const r of reunioes ?? []) {
    if (!ultimaReuniaoPorGrupo.has(r.grupo_id)) {
      ultimaReuniaoPorGrupo.set(r.grupo_id, r.data);
    }
  }

  const hoje = new Date();
  const semSinalDeVida = (grupos ?? []).filter((g) => {
    if (g.status !== "Ativo") return false;
    const ultima = ultimaReuniaoPorGrupo.get(g.id);
    if (!ultima) return true;
    const dias = Math.floor(
      (hoje.getTime() - new Date(ultima + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return dias > DIAS_SEM_SINAL_DE_VIDA;
  });

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
        <div className="rounded-xl border border-border bg-bg-surface p-6">
          <p className="text-sm text-text-secondary">
            Sem sinal de vida (+{DIAS_SEM_SINAL_DE_VIDA}d)
          </p>
          <p
            className={`mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums ${
              semSinalDeVida.length > 0
                ? "text-status-warn-text"
                : "text-text-primary"
            }`}
          >
            {semSinalDeVida.length}
          </p>
        </div>
      </div>

      <GruposTable grupos={grupos ?? []} />
    </div>
  );
}
