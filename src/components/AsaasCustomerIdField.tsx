"use client";

import { useState, useTransition } from "react";
import { updateGrupoCampo } from "@/app/actions/grupos";

export function AsaasCustomerIdField({
  grupoId,
  asaasCustomerId,
}: {
  grupoId: string;
  asaasCustomerId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [valor, setValor] = useState(asaasCustomerId ?? "");

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <label className="text-sm text-text-secondary">
        ID do cliente no Asaas
      </label>
      <input
        type="text"
        value={valor}
        disabled={isPending}
        placeholder="cus_000000000000"
        onChange={(e) => setValor(e.target.value)}
        onBlur={() => {
          if (valor.trim() !== (asaasCustomerId ?? "")) {
            startTransition(() =>
              updateGrupoCampo(grupoId, "asaas_customer_id", valor)
            );
          }
        }}
        className="mt-2 w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
      />
      <p className="mt-2 text-xs text-text-secondary">
        Cole aqui o ID do cliente no Asaas (Clientes → esse cliente → ID no
        topo). Com isso preenchido, pagamentos confirmados no Asaas entram
        aqui automaticamente.
      </p>
    </div>
  );
}
