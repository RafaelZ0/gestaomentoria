"use client";

import { useState, useTransition } from "react";
import { updateGrupoCampo } from "@/app/actions/grupos";
import { importarHistoricoAsaas, buscarClienteAsaasPorDocumento } from "@/app/actions/asaas";

// Integração com o Asaas: ID do cliente no padrão Editar → Salvar, busca do
// ID pelo CPF/CNPJ e importação do histórico.
export function AsaasCustomerIdField({
  grupoId,
  asaasCustomerId,
}: {
  grupoId: string;
  asaasCustomerId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [idSalvo, setIdSalvo] = useState(asaasCustomerId ?? "");
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(asaasCustomerId ?? "");
  const [isImporting, startImport] = useTransition();
  const [resultadoImport, setResultadoImport] = useState<string | null>(null);
  const [erroImport, setErroImport] = useState<string | null>(null);
  const [documento, setDocumento] = useState("");
  const [isBuscando, startBusca] = useTransition();
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [encontrado, setEncontrado] = useState<string | null>(null);

  function salvarId(novo: string) {
    setIdSalvo(novo.trim());
    startTransition(() => updateGrupoCampo(grupoId, "asaas_customer_id", novo));
  }

  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-[15px] font-semibold text-text">Integração com o Asaas</h2>
      <p className="text-[13px] text-muted">
        Cole aqui o ID do cliente no Asaas (Clientes → esse cliente → ID no topo). Com isso
        preenchido, pagamentos confirmados no Asaas entram aqui automaticamente, e boletos
        pendentes/atrasados aparecem ao importar o histórico (sem contar como recebido até serem
        pagos de verdade).
      </p>

      {editando ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvarId(rascunho);
            setEditando(false);
          }}
          className="mt-2 flex flex-wrap items-end gap-2 border-b border-line-soft pb-3"
        >
          <div className="w-72">
            <label className="rotulo mb-1.5">ID do cliente no Asaas</label>
            <input
              type="text"
              value={rascunho}
              autoFocus
              placeholder="cus_000000000000"
              onChange={(e) => setRascunho(e.target.value)}
              className="campo"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setRascunho(idSalvo);
              setEditando(false);
            }}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className="btn-secondary">
            Salvar
          </button>
        </form>
      ) : (
        <div className="mt-1 flex items-baseline justify-between gap-6 border-b border-line-soft py-3 text-[14.5px]">
          <span className="text-muted">ID do cliente no Asaas</span>
          <span className="flex items-baseline gap-4">
            <span className={idSalvo ? "font-mono text-[13.5px] text-text" : "text-muted"}>
              {idSalvo || "Não vinculado"}
            </span>
            <button
              type="button"
              onClick={() => {
                setRascunho(idSalvo);
                setEditando(true);
              }}
              className="link text-[13.5px]"
            >
              Editar
            </button>
          </span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={documento}
          disabled={isBuscando}
          placeholder="CPF ou CNPJ do cliente"
          aria-label="CPF ou CNPJ do cliente"
          onChange={(e) => setDocumento(e.target.value)}
          className="campo w-56"
        />
        <button
          type="button"
          disabled={isBuscando || !documento.trim()}
          onClick={() => {
            setErroBusca(null);
            setEncontrado(null);
            startBusca(async () => {
              const r = await buscarClienteAsaasPorDocumento(documento);
              if (!r.ok) {
                setErroBusca(r.error);
                return;
              }
              setEncontrado(`Encontrado: ${r.name} (${r.id})`);
              salvarId(r.id);
            });
          }}
          className="btn-secondary"
        >
          {isBuscando ? "Buscando…" : "Buscar ID pelo CPF/CNPJ"}
        </button>

        {idSalvo && (
          <button
            type="button"
            disabled={isImporting}
            onClick={() => {
              setErroImport(null);
              setResultadoImport(null);
              startImport(async () => {
                const r = await importarHistoricoAsaas(grupoId);
                if (!r.ok) {
                  setErroImport(r.error);
                  return;
                }
                const partes: string[] = [];
                if (r.importados > 0) partes.push(`${r.importados} novo(s) lançado(s)`);
                if (r.atualizados > 0) {
                  partes.push(`${r.atualizados} atualizado(s) (ex: virou Pago)`);
                }
                const debug = Object.entries(r.porStatus)
                  .map(([status, qtd]) => `${status}: ${qtd}`)
                  .join(", ");
                setResultadoImport(
                  (partes.length > 0
                    ? `${partes.join(", ")} — de ${r.totalEncontrados} encontrados no Asaas.`
                    : `Nada novo — todos os ${r.totalEncontrados} encontrados no Asaas já estavam atualizados.`) +
                    ` (por status no Asaas: ${debug})`
                );
              });
            }}
            className="btn-secondary"
          >
            {isImporting ? "Importando…" : "Importar histórico do Asaas"}
          </button>
        )}
      </div>
      {encontrado && <p className="mt-1 text-[13px] text-ok">{encontrado}</p>}
      {erroBusca && <p className="mt-1 text-[13px] text-danger">{erroBusca}</p>}
      {resultadoImport && <p className="mt-1 text-[13px] text-ok">{resultadoImport}</p>}
      {erroImport && <p className="mt-1 text-[13px] text-danger">{erroImport}</p>}
    </section>
  );
}
