"use client";

import { useState, useTransition } from "react";
import {
  createLancamento,
  removeLancamento,
  updateLancamento,
} from "@/app/actions/financas";
import { formatBRL, formatDate } from "@/lib/format";
import { RowMenu } from "@/components/ui/RowMenu";
import type { LancamentoFinanceiro } from "@/lib/database.types";

export function LancamentosList({
  lancamentos,
}: {
  lancamentos: LancamentoFinanceiro[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col">
      {error && <p className="py-2 text-sm text-danger">{error}</p>}

      {lancamentos.map((l) => (
        <LancamentoRow key={l.id} lancamento={l} />
      ))}
      {lancamentos.length === 0 && (
        <p className="py-2 text-[13.5px] text-muted">Nenhum lançamento registrado ainda.</p>
      )}

      {open ? (
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              try {
                await createLancamento(formData);
                setOpen(false);
              } catch (e) {
                if (e instanceof Error) setError(e.message);
              }
            });
          }}
          className="mt-2 flex flex-col gap-4 border-t border-line-soft pt-4"
        >
          <LancamentoFields />
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="btn-secondary">
              {isPending ? "Salvando…" : "Adicionar"}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="link mt-2 w-fit text-[13.5px]">
          Novo lançamento
        </button>
      )}
    </div>
  );
}

function LancamentoFields({ defaultValues }: { defaultValues?: LancamentoFinanceiro }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="rotulo mb-1.5">Tipo</label>
          <select name="tipo" defaultValue={defaultValues?.tipo ?? "RECEITA"} className="campo">
            <option value="RECEITA">Receita</option>
            <option value="DESPESA">Despesa</option>
          </select>
        </div>
        <div>
          <label className="rotulo mb-1.5">Data</label>
          <input
            type="date"
            name="data"
            defaultValue={defaultValues?.data ?? new Date().toISOString().slice(0, 10)}
            className="campo"
          />
        </div>
      </div>
      <div>
        <label className="rotulo mb-1.5">Descrição</label>
        <input name="descricao" required defaultValue={defaultValues?.descricao} className="campo" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="rotulo mb-1.5">Categoria (opcional)</label>
          <input name="categoria" defaultValue={defaultValues?.categoria ?? ""} className="campo" />
        </div>
        <div>
          <label className="rotulo mb-1.5">Valor (R$)</label>
          <input
            type="number"
            name="valor"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.valor}
            className="campo tabular-nums"
          />
        </div>
      </div>
    </>
  );
}

function LancamentoRow({ lancamento }: { lancamento: LancamentoFinanceiro }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    const isReceita = lancamento.tipo === "RECEITA";
    return (
      <div className="flex min-h-11 items-center justify-between gap-4 border-b border-line-soft py-1.5 text-[14px]">
        <div className="min-w-0">
          <span className="text-text">{lancamento.descricao}</span>
          <span className="ml-2 text-[13px] text-muted">
            {formatDate(lancamento.data)}
            {lancamento.categoria && <> · {lancamento.categoria}</>}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className={`tabular-nums ${isReceita ? "text-ok" : "text-text-2"}`}>
            {isReceita ? "+" : "−"} {formatBRL(Number(lancamento.valor))}
          </span>
          <RowMenu
            rotulo={`Mais opções de ${lancamento.descricao}`}
            acoes={[
              { label: "Editar", onSelect: () => setEditing(true) },
              {
                label: "Remover",
                destrutiva: true,
                confirmar: {
                  titulo: "Remover lançamento?",
                  texto: `${lancamento.descricao} · ${formatBRL(Number(lancamento.valor))}`,
                  botao: "Remover",
                },
                onSelect: () => removeLancamento(lancamento.id),
              },
            ]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-line-soft py-4">
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await updateLancamento(lancamento.id, formData);
              setEditing(false);
            } catch (e) {
              if (e instanceof Error) setError(e.message);
            }
          });
        }}
        className="flex flex-col gap-4"
      >
        <LancamentoFields defaultValues={lancamento} />
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className="btn-secondary">
            {isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
