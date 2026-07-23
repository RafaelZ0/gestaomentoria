"use client";

import { updateGrupoCampo } from "@/app/actions/grupos";
import { ValorEditavel } from "@/components/ValorEditavel";

export function MetaComparacaoCard({
  grupoId,
  label,
  campo,
  realizado,
  meta,
  formatarValor,
  melhorQuandoMaior,
}: {
  grupoId: string;
  label: string;
  campo: "meta_cpl" | "meta_roas";
  realizado: number | null;
  meta: number | null;
  formatarValor: (v: number) => string;
  melhorQuandoMaior: boolean;
}) {
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
