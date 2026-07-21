"use client";

import { useState, useTransition } from "react";
import { createReuniao } from "@/app/actions/reunioes";
import { addResponsavel } from "@/app/actions/responsaveis";
import type { Responsavel } from "@/lib/database.types";

type MentoradoOutroGrupo = { id: string; nome: string; grupoNome: string };

export function NovaReuniaoForm({
  grupoId,
  entregasPendentes,
  mentoradosDoGrupo,
  mentoradosOutrosGrupos,
  responsaveis,
}: {
  grupoId: string;
  entregasPendentes: { id: string; nome: string }[];
  mentoradosDoGrupo: { id: string; nome: string }[];
  mentoradosOutrosGrupos: MentoradoOutroGrupo[];
  responsaveis: Responsavel[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mostrarOutrosGrupos, setMostrarOutrosGrupos] = useState(false);
  const [novoResponsavel, setNovoResponsavel] = useState(false);
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [listaResponsaveis, setListaResponsaveis] = useState(responsaveis);
  const [responsavelId, setResponsavelId] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        + Nova reunião
      </button>
    );
  }

  const gruposOutros = new Map<string, MentoradoOutroGrupo[]>();
  for (const m of mentoradosOutrosGrupos) {
    const lista = gruposOutros.get(m.grupoNome) ?? [];
    lista.push(m);
    gruposOutros.set(m.grupoNome, lista);
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await createReuniao(grupoId, formData);
            setOpen(false);
          } catch (e) {
            if (e instanceof Error) setError(e.message);
          }
        });
      }}
      className="space-y-4 rounded-xl border border-border bg-bg-surface p-6"
    >
      {error && (
        <div className="rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-text-secondary">Data</label>
          <input
            type="date"
            name="data"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-text-secondary">
            Quem conduziu a reunião
          </label>
          {!novoResponsavel ? (
            <div className="flex gap-2">
              <select
                name="responsavel_id"
                value={responsavelId}
                onChange={(e) => setResponsavelId(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
              >
                <option value="">—</option>
                {listaResponsaveis.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNovoResponsavel(true)}
                className="whitespace-nowrap rounded-lg border border-border px-3 py-2 text-xs text-text-secondary hover:bg-bg-surface-hover"
              >
                + Novo
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                autoFocus
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                placeholder="Nome do responsável"
                className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
              />
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      const responsavel = await addResponsavel(nomeResponsavel);
                      setListaResponsaveis((atual) => [...atual, responsavel]);
                      setResponsavelId(responsavel.id);
                      setNomeResponsavel("");
                      setNovoResponsavel(false);
                    } catch (e) {
                      if (e instanceof Error) setError(e.message);
                    }
                  })
                }
                className="whitespace-nowrap rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              >
                Salvar
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">
          O que foi conversado e definido
        </label>
        <textarea
          name="resumo"
          required
          rows={4}
          className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
        />
      </div>

      <div>
        <p className="mb-2 text-sm text-text-secondary">Quem participou</p>
        <div className="space-y-2">
          {mentoradosDoGrupo.map((m) => (
            <label
              key={m.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
            >
              <input
                type="checkbox"
                name="participante_id"
                value={m.id}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              {m.nome}
            </label>
          ))}
          {mentoradosDoGrupo.length === 0 && (
            <p className="text-sm text-text-secondary">
              Nenhum mentorado cadastrado neste grupo.
            </p>
          )}
        </div>

        {mentoradosOutrosGrupos.length > 0 && (
          <div className="mt-3">
            {!mostrarOutrosGrupos ? (
              <button
                type="button"
                onClick={() => setMostrarOutrosGrupos(true)}
                className="text-sm text-accent hover:text-accent-hover"
              >
                + Adicionar pessoa de outro grupo
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">
                  A reunião também aparecerá na aba Reuniões do grupo dessa pessoa.
                </p>
                {[...gruposOutros.entries()].map(([grupoNome, mentorados]) => (
                  <div key={grupoNome}>
                    <p className="mb-1 text-xs font-medium text-text-secondary">
                      {grupoNome}
                    </p>
                    <div className="space-y-2">
                      {mentorados.map((m) => (
                        <label
                          key={m.id}
                          className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
                        >
                          <input
                            type="checkbox"
                            name="participante_id"
                            value={m.id}
                            className="h-4 w-4 accent-[var(--accent)]"
                          />
                          {m.nome}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {entregasPendentes.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-text-secondary">
            Entregas feitas nesta reunião (opcional)
          </p>
          <div className="space-y-2">
            {entregasPendentes.map((e) => (
              <label
                key={e.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-sm text-text-primary"
              >
                <input
                  type="checkbox"
                  name="entrega_feita"
                  value={e.id}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                {e.nome}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {isPending ? "Salvando…" : "Registrar reunião"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
