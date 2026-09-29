"use client";

import { useState, useTransition } from "react";
import { createCustoFixo, removeCustoFixo, updateCustoFixo } from "@/app/actions/custoHora";
import { formatBRL } from "@/lib/format";
import { RowMenu } from "@/components/ui/RowMenu";
import type { CustoFixo } from "@/lib/database.types";

export function CustosFixosList({ custos }: { custos: CustoFixo[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = custos.reduce((acc, c) => acc + Number(c.valor), 0);

  return (
    <div className="flex flex-col gap-5">
      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col">
        {custos.map((c) => (
          <CustoFixoRow key={c.id} custo={c} />
        ))}
        {custos.length === 0 && (
          <p className="py-3 text-sm text-muted">Nenhum custo fixo cadastrado ainda.</p>
        )}
        <div className="flex items-baseline justify-between gap-4 border-t border-line py-3 text-[14.5px]">
          <span className="text-muted">Total de custos fixos</span>
          <span className="font-medium tabular-nums text-text">{formatBRL(total)}</span>
        </div>
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
        className="flex flex-wrap items-end gap-2"
      >
        <div className="min-w-48 flex-1">
          <label className="rotulo mb-1.5">Nome</label>
          <input name="nome" required placeholder="Ex: Pró-labore" className="campo" />
        </div>
        <div className="w-40">
          <label className="rotulo mb-1.5">Valor (R$)</label>
          <input name="valor" type="number" step="0.01" min="0" required className="campo tabular-nums" />
        </div>
        <button type="submit" disabled={isPending} className="btn-secondary">
          Adicionar
        </button>
      </form>
    </div>
  );
}

function CustoFixoRow({ custo }: { custo: CustoFixo }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(custo.nome);
  const [valor, setValor] = useState(String(custo.valor));

  function cancelar() {
    setNome(custo.nome);
    setValor(String(custo.valor));
    setEditando(false);
    setError(null);
  }

  function salvar() {
    if (!nome.trim() || !valor) return;
    setError(null);
    const formData = new FormData();
    formData.set("nome", nome);
    formData.set("valor", valor);
    startTransition(async () => {
      try {
        await updateCustoFixo(custo.id, formData);
        setEditando(false);
      } catch (e) {
        if (e instanceof Error) setError(e.message);
      }
    });
  }

  if (editando) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          salvar();
        }}
        className="flex flex-wrap items-end gap-2 border-b border-line-soft py-3"
      >
        {error && <p className="w-full text-xs text-danger">{error}</p>}
        <div className="min-w-48 flex-1">
          <label className="rotulo mb-1.5">Nome</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus className="campo" />
        </div>
        <div className="w-40">
          <label className="rotulo mb-1.5">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="campo tabular-nums"
          />
        </div>
        <button type="button" onClick={cancelar} className="btn-secondary">
          Cancelar
        </button>
        <button type="submit" disabled={isPending} className="btn-secondary">
          {isPending ? "Salvando…" : "Salvar"}
        </button>
      </form>
    );
  }

  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b border-line-soft py-1.5 text-[14.5px]">
      <span className="text-text">{custo.nome}</span>
      <span className="flex items-center gap-3">
        <span className="tabular-nums text-text-2">{formatBRL(Number(custo.valor))}</span>
        <RowMenu
          rotulo={`Mais opções de ${custo.nome}`}
          acoes={[
            { label: "Editar", onSelect: () => setEditando(true) },
            {
              label: "Remover",
              destrutiva: true,
              confirmar: {
                titulo: `Remover ${custo.nome}?`,
                texto: `${formatBRL(Number(custo.valor))} deixa de contar nos custos fixos.`,
                botao: "Remover",
              },
              onSelect: () => removeCustoFixo(custo.id),
            },
          ]}
        />
      </span>
    </div>
  );
}
