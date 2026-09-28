"use client";

import { useState, useTransition } from "react";
import { addMentorado, removeMentorado, updateMentorado } from "@/app/actions/grupos";
import { formatTelefone } from "@/lib/format";
import { RowMenu } from "@/components/ui/RowMenu";
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
    <section className="flex flex-col">
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text">Mentorados</h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="link text-[13.5px]">
            Adicionar
          </button>
        )}
      </div>

      {mentorados.length === 0 && !adding && (
        <p className="border-b border-line-soft py-3 text-sm text-muted">
          Nenhum mentorado cadastrado.
        </p>
      )}

      {mentorados.map((m) => (
        <MentoradoRow key={m.id} grupoId={grupoId} mentorado={m} />
      ))}

      {adding && (
        <form
          action={(formData) =>
            startTransition(async () => {
              await addMentorado(grupoId, formData);
              setAdding(false);
            })
          }
          className="flex flex-wrap items-end gap-3 border-b border-line-soft py-3"
        >
          <label className="flex min-w-40 flex-1 flex-col gap-1.5">
            <span className="rotulo">Nome</span>
            <input name="nome" required autoFocus className="campo" />
          </label>
          <label className="flex min-w-40 flex-1 flex-col gap-1.5">
            <span className="rotulo">Telefone</span>
            <input name="telefone" className="campo" />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="btn-secondary">
              {isPending ? "Adicionando…" : "Adicionar"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function MentoradoRow({ grupoId, mentorado }: { grupoId: string; mentorado: Mentorado }) {
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(mentorado.nome);
  const [telefone, setTelefone] = useState(mentorado.telefone ?? "");

  function cancelar() {
    setNome(mentorado.nome);
    setTelefone(mentorado.telefone ?? "");
    setEditando(false);
  }

  if (editando) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!nome.trim()) return;
          startTransition(async () => {
            await updateMentorado(grupoId, mentorado.id, nome, telefone);
            setEditando(false);
          });
        }}
        className="flex flex-wrap items-end gap-3 border-b border-line-soft py-3"
      >
        <label className="flex min-w-40 flex-1 flex-col gap-1.5">
          <span className="rotulo">Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} required autoFocus className="campo" />
        </label>
        <label className="flex min-w-40 flex-1 flex-col gap-1.5">
          <span className="rotulo">Telefone</span>
          <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="campo" />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={cancelar} className="btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className="btn-secondary">
            {isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex h-12 items-center justify-between gap-3 border-b border-line-soft text-[14.5px]">
      <span className="truncate text-text">{mentorado.nome}</span>
      <span className="flex shrink-0 items-center gap-4 text-[13.5px] text-muted">
        {mentorado.telefone ? formatTelefone(mentorado.telefone) : "—"}
        <RowMenu
          rotulo={`Mais opções de ${mentorado.nome}`}
          acoes={[
            { label: "Editar", onSelect: () => setEditando(true) },
            {
              label: "Remover",
              destrutiva: true,
              confirmar: {
                titulo: `Remover ${mentorado.nome}?`,
                texto: "O mentorado sai deste grupo.",
                botao: "Remover",
              },
              onSelect: () =>
                new Promise<void>((resolve) =>
                  startTransition(async () => {
                    await removeMentorado(grupoId, mentorado.id);
                    resolve();
                  })
                ),
            },
          ]}
        />
      </span>
    </div>
  );
}
