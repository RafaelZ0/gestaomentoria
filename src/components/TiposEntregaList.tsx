"use client";

import { useState, useTransition } from "react";
import { createTipoEntrega, toggleTipoEntregaAtivo } from "@/app/actions/tiposEntrega";
import { formatDate } from "@/lib/format";
import { StatusDot } from "@/components/ui/StatusDot";
import { RowMenu } from "@/components/ui/RowMenu";
import type { TipoEntrega } from "@/lib/database.types";

const COLUNAS = "grid-cols-[1fr_150px_110px_36px]";

export function TiposEntregaList({ tipos }: { tipos: TipoEntrega[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await createTipoEntrega(formData);
            } catch (e) {
              if (e instanceof Error) setError(e.message);
            }
          });
        }}
        className="flex gap-2"
      >
        <input
          name="nome"
          required
          placeholder="Nome do novo processo…"
          aria-label="Nome do novo processo"
          className="campo flex-1"
        />
        <button type="submit" disabled={isPending} className="btn-secondary">
          Adicionar
        </button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col">
        <div className={`grid ${COLUNAS} gap-3 border-b border-line px-3 pb-2.5 pt-1 text-[12.5px] text-subtle`}>
          <span>Nome</span>
          <span>Ativo desde</span>
          <span>Status</span>
          <span />
        </div>
        {tipos.map((t) => (
          <TipoRow key={t.id} tipo={t} />
        ))}
        {tipos.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-muted">Nenhum processo cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}

function TipoRow({ tipo }: { tipo: TipoEntrega }) {
  const [isPending, startTransition] = useTransition();
  const [editandoData, setEditandoData] = useState(false);
  const [statusDesde, setStatusDesde] = useState(
    tipo.status_desde ?? new Date().toISOString().slice(0, 10)
  );

  function salvarData() {
    startTransition(async () => {
      await toggleTipoEntregaAtivo(tipo.id, tipo.ativo, statusDesde);
      setEditandoData(false);
    });
  }

  return (
    <div
      className={`grid ${COLUNAS} min-h-12 items-center gap-3 border-b border-line-soft px-3 py-1.5 text-[14.5px] last:border-b-0`}
    >
      <span className={tipo.ativo ? "text-text" : "text-muted"}>{tipo.nome}</span>
      <span className="text-[13.5px] tabular-nums text-text-2">
        {editandoData ? (
          <input
            type="date"
            value={statusDesde}
            disabled={isPending}
            autoFocus
            onChange={(e) => setStatusDesde(e.target.value)}
            className="campo h-8 px-2 text-[13px]"
          />
        ) : (
          formatDate(statusDesde)
        )}
      </span>
      <span className="text-[13.5px]">
        <StatusDot tom={tipo.ativo ? "ok" : "off"}>{tipo.ativo ? "Ativo" : "Inativo"}</StatusDot>
      </span>
      {editandoData ? (
        <span className="col-span-4 flex justify-end gap-2 pb-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setStatusDesde(tipo.status_desde ?? new Date().toISOString().slice(0, 10));
              setEditandoData(false);
            }}
            className="btn-secondary h-8 px-3 text-[13px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={salvarData}
            className="btn-secondary h-8 px-3 text-[13px]"
          >
            Salvar
          </button>
        </span>
      ) : (
        <RowMenu
          rotulo={`Mais opções de ${tipo.nome}`}
          acoes={[
            { label: "Editar data", onSelect: () => setEditandoData(true) },
            tipo.ativo
              ? {
                  label: "Desativar",
                  destrutiva: true,
                  confirmar: {
                    titulo: `Desativar “${tipo.nome}”?`,
                    texto: "O processo sai do checklist dos grupos. O histórico já registrado não é apagado.",
                    botao: "Desativar",
                  },
                  onSelect: () => toggleTipoEntregaAtivo(tipo.id, false, statusDesde),
                }
              : {
                  label: "Reativar",
                  onSelect: () => toggleTipoEntregaAtivo(tipo.id, true, statusDesde),
                },
          ]}
        />
      )}
    </div>
  );
}
