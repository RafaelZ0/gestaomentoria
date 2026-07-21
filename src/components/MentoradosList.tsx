"use client";

import { useState, useTransition } from "react";
import { addMentorado, removeMentorado, updateMentorado } from "@/app/actions/grupos";
import type { Mentorado } from "@/lib/database.types";

export function MentoradosList({
  grupoId,
  mentorados,
}: {
  grupoId: string;
  mentorados: Mentorado[];
}) {
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      {mentorados.length === 0 && !adding && (
        <p className="text-sm text-text-secondary">Nenhum mentorado cadastrado.</p>
      )}
      <ul className="space-y-2">
        {mentorados.map((m) => (
          <MentoradoRow key={m.id} grupoId={grupoId} mentorado={m} />
        ))}
      </ul>

      {adding ? (
        <form
          action={(formData) =>
            startTransition(async () => {
              await addMentorado(grupoId, formData);
              setAdding(false);
            })
          }
          className="flex items-end gap-3"
        >
          <div className="flex-1">
            <label className="mb-1 block text-sm text-text-secondary">Nome</label>
            <input
              name="nome"
              required
              className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm text-text-secondary">Telefone</label>
            <input
              name="telefone"
              className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="btn-secondary"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-sm text-accent hover:text-accent-hover"
        >
          + Adicionar mentorado
        </button>
      )}
    </div>
  );
}

function MentoradoRow({
  grupoId,
  mentorado,
}: {
  grupoId: string;
  mentorado: Mentorado;
}) {
  const [isPending, startTransition] = useTransition();
  const [nome, setNome] = useState(mentorado.nome);
  const [telefone, setTelefone] = useState(mentorado.telefone ?? "");

  function salvar(novoNome: string, novoTelefone: string) {
    if (!novoNome.trim()) {
      setNome(mentorado.nome);
      return;
    }
    if (novoNome === mentorado.nome && novoTelefone === (mentorado.telefone ?? "")) {
      return;
    }
    startTransition(() =>
      updateMentorado(grupoId, mentorado.id, novoNome, novoTelefone)
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-surface-hover px-4 py-3 text-sm">
      <div className="flex flex-1 gap-3">
        <input
          value={nome}
          disabled={isPending}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => salvar(nome, telefone)}
          className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-text-primary outline-none hover:border-border focus:border-accent"
        />
        <input
          value={telefone}
          placeholder="Telefone"
          disabled={isPending}
          onChange={(e) => setTelefone(e.target.value)}
          onBlur={() => salvar(nome, telefone)}
          className="w-40 rounded-lg border border-transparent bg-transparent px-2 py-1 text-text-secondary outline-none hover:border-border focus:border-accent"
        />
      </div>
      <button
        disabled={isPending}
        onClick={() => startTransition(() => removeMentorado(grupoId, mentorado.id))}
        className="text-text-secondary hover:text-status-alert-text"
      >
        Remover
      </button>
    </li>
  );
}
