"use client";

import { updateGrupoCampo } from "@/app/actions/grupos";
import { formatBRL } from "@/lib/format";
import { ValorEditavel } from "@/components/ValorEditavel";

export function ValorMensalCard({
  grupoId,
  valorMensal,
}: {
  grupoId: string;
  valorMensal: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <ValorEditavel
        label="Valor mensal"
        valor={valorMensal}
        formatarExibicao={formatBRL}
        onSalvar={(novoValor) =>
          updateGrupoCampo(grupoId, "valor_mensal", String(novoValor))
        }
      />
    </div>
  );
}
