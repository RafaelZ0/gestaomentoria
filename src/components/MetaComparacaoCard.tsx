"use client";

import { updateGrupoCampo } from "@/app/actions/grupos";
import { ValorEditavel } from "@/components/ValorEditavel";
import { formatBRL } from "@/lib/format";

// formatarValor não pode ser passado como prop de função de um Server
// Component (page.tsx) pra esse Client Component — o Next.js quebra em
// producao ("Functions cannot be passed directly to Client Components").
// Em vez disso, recebe só a unidade (string, serializável) e decide o
// formato aqui dentro.
function formatarPorUnidade(unidade: "brl" | "roas", v: number): string {
  return unidade === "roas" ? `${v.toFixed(1)}x` : formatBRL(v);
}

export function MetaComparacaoCard({
  grupoId,
  label,
  campo,
  realizado,
  meta,
  unidade,
  melhorQuandoMaior,
}: {
  grupoId: string;
  label: string;
  campo: "meta_cpl" | "meta_roas";
  realizado: number | null;
  meta: number | null;
  unidade: "brl" | "roas";
  melhorQuandoMaior: boolean;
}) {
  const formatarValor = (v: number) => formatarPorUnidade(unidade, v);
  const dentroDaMeta =
    realizado !== null && meta !== null
      ? melhorQuandoMaior
        ? realizado >= meta
        : realizado <= meta
      : null;

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <div className="flex items-center gap-2">
        <p className="text-sm text-text-secondary">{label}</p>
        {dentroDaMeta !== null && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              dentroDaMeta
                ? "bg-status-ok-bg text-status-ok-text"
                : "bg-status-alert-bg text-status-alert-text"
            }`}
          >
            {dentroDaMeta ? "dentro da meta" : "fora da meta"}
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-xl font-semibold tracking-tight tabular-nums text-text-primary">
        {realizado === null ? "—" : formatarValor(realizado)}
      </p>
      <div className="mt-3 border-t border-border pt-3">
        <ValorEditavel
          label="Meta"
          valor={meta ?? 0}
          formatarExibicao={(v) => (meta === null ? "—" : formatarValor(v))}
          onSalvar={(novoValor) =>
            updateGrupoCampo(grupoId, campo, String(novoValor))
          }
        />
      </div>
    </div>
  );
}
