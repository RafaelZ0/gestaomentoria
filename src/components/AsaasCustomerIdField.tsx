"use client";

import { useState, useTransition } from "react";
import { updateGrupoCampo } from "@/app/actions/grupos";
import {
  importarHistoricoAsaas,
  buscarClienteAsaasPorDocumento,
} from "@/app/actions/asaas";

export function AsaasCustomerIdField({
  grupoId,
  asaasCustomerId,
}: {
  grupoId: string;
  asaasCustomerId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [valor, setValor] = useState(asaasCustomerId ?? "");
  const [isImporting, startImport] = useTransition();
  const [resultadoImport, setResultadoImport] = useState<string | null>(null);
  const [erroImport, setErroImport] = useState<string | null>(null);
  const [documento, setDocumento] = useState("");
  const [isBuscando, startBusca] = useTransition();
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [encontrado, setEncontrado] = useState<string | null>(null);

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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={documento}
          disabled={isBuscando}
          placeholder="CPF ou CNPJ do cliente"
          onChange={(e) => setDocumento(e.target.value)}
          className="w-56 rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
        <button
          type="button"
          disabled={isBuscando || !documento.trim()}
          onClick={() => {
            setErroBusca(null);
            setEncontrado(null);
            startBusca(async () => {
              try {
                const cliente = await buscarClienteAsaasPorDocumento(documento);
                setValor(cliente.id);
                setEncontrado(`Encontrado: ${cliente.name} (${cliente.id})`);
                startTransition(() =>
                  updateGrupoCampo(grupoId, "asaas_customer_id", cliente.id)
                );
              } catch (e) {
                setErroBusca(
                  e instanceof Error ? e.message : "Erro ao buscar cliente."
                );
              }
            });
          }}
          className="btn-secondary text-sm"
        >
          {isBuscando ? "Buscando…" : "Buscar ID pelo CPF/CNPJ"}
        </button>
      </div>
      {encontrado && (
        <p className="mt-2 text-xs text-status-ok-text">{encontrado}</p>
      )}
      {erroBusca && (
        <p className="mt-2 text-xs text-status-alert-text">{erroBusca}</p>
      )}

      {valor.trim() && (
        <div className="mt-4 border-t border-border pt-4">
          <button
            type="button"
            disabled={isImporting}
            onClick={() => {
              setErroImport(null);
              setResultadoImport(null);
              startImport(async () => {
                try {
                  const r = await importarHistoricoAsaas(grupoId);
                  setResultadoImport(
                    r.importados > 0
                      ? `${r.importados} pagamento(s) novo(s) importado(s) do histórico (de ${r.totalEncontrados} encontrados no Asaas).`
                      : `Nenhum pagamento novo — todos os ${r.totalEncontrados} encontrados no Asaas já estavam registrados.`
                  );
                } catch (e) {
                  setErroImport(
                    e instanceof Error ? e.message : "Erro ao importar histórico."
                  );
                }
              });
            }}
            className="btn-secondary text-sm"
          >
            {isImporting ? "Importando…" : "Importar histórico do Asaas"}
          </button>
          {resultadoImport && (
            <p className="mt-2 text-xs text-status-ok-text">{resultadoImport}</p>
          )}
          {erroImport && (
            <p className="mt-2 text-xs text-status-alert-text">{erroImport}</p>
          )}
        </div>
      )}
    </div>
  );
}
