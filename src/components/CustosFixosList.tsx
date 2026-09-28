"use client";

import { useState, useTransition } from "react";
import {
  createCustoFixo,
  removeCustoFixo,
  updateCustoFixo,
} from "@/app/actions/custoHora";
import { formatBRL } from "@/lib/format";
import type { CustoFixo } from "@/lib/database.types";

const inputClass =
  "w-full rounded-lg border border-line bg-hover px-3 py-2 text-text outline-none focus:border-gold";

export function CustosFixosList({ custos }: { custos: CustoFixo[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = custos.reduce((acc, c) => acc + Number(c.valor), 0);

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {custos.map((c) => (
          <CustoFixoRow key={c.id} custo={c} />
        ))}
        {custos.length === 0 && (
          <p className="text-sm text-text-2">
            Nenhum custo fixo cadastrado ainda.
          </p>
        )}
      </ul>

      <div className="flex items-center justify-between rounded-lg border border-line bg-hover px-4 py-3 text-sm">
        <span className="text-text-2">Total de custos fixos</span>
        <span className="tabular-nums font-medium text-text">
          {formatBRL(total)}
        </span>
      </div>

      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await createCustoFixo(formData);
            } catch (e) {
              if (e instanceof Error) setError(e.message);
            }
          });
        }}
        className="flex items-end gap-3"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm text-text-2">Nome</label>
          <input
            name="nome"
            required
            placeholder="Ex: Pró-labore"
            className={inputClass}
          />
        </div>
        <div className="w-40">
          <label className="mb-1 block text-sm text-text-2">Valor (R$)</label>
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0"
            required
            className={`${inputClass} tabular-nums`}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-gold hover:bg-gold-hover disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>
    </div>
  );
}

function CustoFixoRow({ custo }: { custo: CustoFixo }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nome, setNome] = useState(custo.nome);
  const [valor, setValor] = useState(String(custo.valor));

  function salvar(novoNome: string, novoValor: string) {
    if (!novoNome.trim() || !novoValor) return;
    if (novoNome === custo.nome && Number(novoValor) === Number(custo.valor)) return;
    setError(null);
    const formData = new FormData();
    formData.set("nome", novoNome);
    formData.set("valor", novoValor);
    startTransition(async () => {
      try {
        await updateCustoFixo(custo.id, formData);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
      }
    });
  }

  return (
    <li className="rounded-lg border border-line bg-hover px-4 py-3 text-sm">
      {error && (
        <div className="mb-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          value={nome}
          disabled={isPending}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => salvar(nome, valor)}
          className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-text outline-none hover:border-line focus:border-gold"
        />
        <input
          type="number"
          step="0.01"
          min="0"
          value={valor}
          disabled={isPending}
          onChange={(e) => setValor(e.target.value)}
          onBlur={() => salvar(nome, valor)}
          className="w-28 rounded-lg border border-transparent bg-transparent px-2 py-1 text-right tabular-nums text-text outline-none hover:border-line focus:border-gold"
        />
        <button
          disabled={isPending}
          onClick={() => startTransition(() => removeCustoFixo(custo.id))}
          className="text-text-2 hover:text-danger"
        >
          Remover
        </button>
      </div>
    </li>
  );
}
