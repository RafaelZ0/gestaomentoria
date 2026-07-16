import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcFaturamentoEstimado, formatBRL, formatDate } from "@/lib/format";
import {
  StatusBadge,
  statusGrupoVariant,
  trafegoPagoVariant,
} from "@/components/StatusBadge";

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
        <h1 className="font-display text-2xl font-semibold text-text-primary">
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
        <div className="rounded-xl border border-border bg-bg-surface p-6 sm:col-span-1">
          <p className="text-sm text-text-secondary">Faturamento total (estimado)</p>
          <p className="mt-2 font-display text-4xl font-bold tabular-nums text-text-primary">
            {formatBRL(faturamentoTotal)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg-surface p-6">
          <p className="text-sm text-text-secondary">Grupos ativos</p>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-text-primary">
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
            className={`mt-2 font-display text-2xl font-semibold tabular-nums ${
              semSinalDeVida.length > 0
                ? "text-status-warn-text"
                : "text-text-primary"
            }`}
          >
            {semSinalDeVida.length}
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Tráfego pago</th>
              <th className="px-4 py-3 font-medium">Valor mensal</th>
              <th className="px-4 py-3 font-medium">Início</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(grupos ?? []).map((g) => (
              <tr
                key={g.id}
                className="border-b border-border last:border-0 hover:bg-bg-surface-hover"
              >
                <td className="px-4 py-3 font-medium text-text-primary">
                  {g.nome}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    label={g.status}
                    variant={statusGrupoVariant(g.status)}
                  />
                </td>
                <td className="px-4 py-3">
                  {g.trafego_pago ? (
                    <StatusBadge
                      label={g.trafego_pago}
                      variant={trafegoPagoVariant(g.trafego_pago)}
                    />
                  ) : (
                    <span className="text-text-secondary">—</span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-primary">
                  {formatBRL(Number(g.valor_mensal))}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-secondary">
                  {formatDate(g.data_inicio)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/grupos/${g.id}`}
                    className="text-accent hover:text-accent-hover"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
            {(grupos ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-text-secondary"
                >
                  Nenhum grupo cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
