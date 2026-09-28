"use client";

import { useState, useTransition } from "react";
import {
  createLancamento,
  removeLancamento,
  updateLancamento,
} from "@/app/actions/financas";
import { formatBRL, formatDate } from "@/lib/format";
import type { LancamentoFinanceiro } from "@/lib/database.types";

const inputClass =
  "w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold";

export function LancamentosList({
  lancamentos,
}: {
  lancamentos: LancamentoFinanceiro[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {lancamentos.map((l) => (
          <LancamentoRow key={l.id} lancamento={l} />
        ))}
        {lancamentos.length === 0 && (
          <p className="text-sm text-text-2">
            Nenhum lançamento registrado ainda.
          </p>
        )}
      </ul>

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
          className="space-y-4 rounded-xl border border-line bg-surface p-6"
        >
          <LancamentoFields />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover disabled:opacity-60"
            >
              {isPending ? "Salvando…" : "Adicionar"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover"
        >
          + Novo lançamento
        </button>
      )}
    </div>
  );
}

function LancamentoFields({
  defaultValues,
}: {
  defaultValues?: LancamentoFinanceiro;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-text-2">Tipo</label>
          <select
            name="tipo"
            defaultValue={defaultValues?.tipo ?? "RECEITA"}
            className={inputClass}
          >
            <option value="RECEITA">Receita</option>
            <option value="DESPESA">Despesa</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-2">Data</label>
          <input
            type="date"
            name="data"
            defaultValue={
              defaultValues?.data ?? new Date().toISOString().slice(0, 10)
            }
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-text-2">Descrição</label>
        <input
          name="descricao"
          required
          defaultValue={defaultValues?.descricao}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-text-2">
            Categoria (opcional)
          </label>
          <input
            name="categoria"
            defaultValue={defaultValues?.categoria ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-text-2">
            Valor (R$)
          </label>
          <input
            type="number"
            name="valor"
            step="0.01"
            min="0"
            required
            defaultValue={defaultValues?.valor}
            className={`${inputClass} tabular-nums`}
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
      <li className="flex items-center justify-between rounded-lg border border-line bg-hover px-4 py-3 text-sm">
        <div>
          <span className="text-text">{lancamento.descricao}</span>
          <span className="ml-2 text-text-2">
            {formatDate(lancamento.data)}
            {lancamento.categoria && <> · {lancamento.categoria}</>}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`tabular-nums font-medium ${
              isReceita ? "text-ok" : "text-danger"
            }`}
          >
            {isReceita ? "+" : "−"} {formatBRL(Number(lancamento.valor))}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="text-text-2 hover:text-text"
          >
            Editar
          </button>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => removeLancamento(lancamento.id))
            }
            className="text-text-2 hover:text-danger"
          >
            Remover
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-line bg-hover px-4 py-3">
      {error && (
        <div className="mb-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
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
        className="space-y-4"
      >
        <LancamentoFields defaultValues={lancamento} />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover disabled:opacity-60"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </li>
  );
}
