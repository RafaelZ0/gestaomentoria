"use client";

import { useState, useTransition } from "react";
import { updateTrafego } from "@/app/actions/grupos";
import type { TrafegoPago } from "@/lib/database.types";

export function TrafegoCard({
  grupoId,
  trafegoPago,
  valorInvestidoDia,
}: {
  grupoId: string;
  trafegoPago: TrafegoPago | null;
  valorInvestidoDia: number | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [trafego, setTrafego] = useState<TrafegoPago | "">(trafegoPago ?? "");
  const [valor, setValor] = useState(
    valorInvestidoDia !== null ? String(valorInvestidoDia) : ""
  );

  function salvar(novoTrafego: TrafegoPago | "", novoValor: string) {
    const formData = new FormData();
    formData.set("trafego_pago", novoTrafego);
    formData.set("valor_investido_dia", novoValor);
    startTransition(() => updateTrafego(grupoId, formData));
  }

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <p className="text-sm text-text-secondary">Tráfego pago</p>
      <select
        value={trafego}
        disabled={isPending}
        onChange={(e) => {
          const novoTrafego = e.target.value as TrafegoPago | "";
          setTrafego(novoTrafego);
          salvar(novoTrafego, valor);
        }}
        className="mt-2 w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
      >
        <option value="">—</option>
        <option value="SIM">SIM</option>
        <option value="NÃO">NÃO</option>
        <option value="PARADO">PARADO</option>
        <option value="EM IMPLEMENTAÇÃO">EM IMPLEMENTAÇÃO</option>
      </select>

      <p className="mt-3 text-sm text-text-secondary">Investimento por dia</p>
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={valor}
          disabled={isPending}
          onChange={(e) => setValor(e.target.value)}
          onBlur={() => salvar(trafego, valor)}
          placeholder="0,00"
          className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:border-accent tabular-nums"
        />
        <span className="flex items-center text-xs text-text-secondary">R$/dia</span>
      </div>
    </div>
  );
}
