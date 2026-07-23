"use client";

import { useState, useTransition } from "react";
import { updateTrafego } from "@/app/actions/grupos";
import { ValorEditavel } from "@/components/ValorEditavel";
import { formatBRL } from "@/lib/format";
import type { TrafegoPago } from "@/lib/database.types";

export function TrafegoCard({
  grupoId,
  trafegoPago,
  trafegoPagoDesde,
  valorInvestidoDia,
}: {
  grupoId: string;
  trafegoPago: TrafegoPago | null;
  trafegoPagoDesde: string | null;
  valorInvestidoDia: number | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [trafego, setTrafego] = useState<TrafegoPago | "">(trafegoPago ?? "");
  const [desde, setDesde] = useState(
    trafegoPagoDesde ?? new Date().toISOString().slice(0, 10)
  );

  function salvar(novoTrafego: TrafegoPago | "", novoDesde: string, novoValor: string) {
    const formData = new FormData();
    formData.set("trafego_pago", novoTrafego);
    formData.set("trafego_pago_desde", novoDesde);
    formData.set("valor_investido_dia", novoValor);
    return updateTrafego(grupoId, formData);
  }

  const valorInvestidoAtual = valorInvestidoDia ?? 0;

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <p className="text-sm text-text-secondary">Tráfego pago</p>
      <select
        value={trafego}
        disabled={isPending}
        onChange={(e) => {
          const novoTrafego = e.target.value as TrafegoPago | "";
          setTrafego(novoTrafego);
          startTransition(() =>
            salvar(novoTrafego, desde, String(valorInvestidoAtual))
          );
        }}
        className="mt-2 w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
      >
        <option value="">—</option>
        <option value="SIM">SIM</option>
        <option value="NÃO">NÃO</option>
        <option value="PARADO">PARADO</option>
        <option value="EM IMPLEMENTAÇÃO">EM IMPLEMENTAÇÃO</option>
      </select>

      <p className="mt-3 text-sm text-text-secondary">Tráfego pago ativo desde</p>
      <input
        type="date"
        value={desde}
        disabled={isPending}
        onChange={(e) => setDesde(e.target.value)}
        onBlur={() =>
          startTransition(() =>
            salvar(trafego, desde, String(valorInvestidoAtual))
          )
        }
        className="mt-2 w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
      />

      <div className="mt-3">
        <ValorEditavel
          label="Investimento por dia"
          valor={valorInvestidoAtual}
          formatarExibicao={formatBRL}
          sufixo="/dia"
          onSalvar={(novoValor) =>
            salvar(trafego, desde, String(novoValor))
          }
        />
      </div>
    </div>
  );
}
