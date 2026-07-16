"use client";

import { useState, useTransition } from "react";
import { createGrupo } from "@/app/actions/grupos";

export function NovoGrupoForm() {
  const [mentorados, setMentorados] = useState([0]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await createGrupo(formData);
          } catch (e) {
            const digest = (e as { digest?: string })?.digest;
            if (digest?.startsWith("NEXT_REDIRECT")) throw e;
            if (e instanceof Error) setError(e.message);
          }
        });
      }}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-lg bg-status-alert-bg px-3 py-2 text-sm text-status-alert-text">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-bg-surface p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          Dados do grupo
        </h2>

        <Field label="Nome do grupo" htmlFor="nome">
          <input
            id="nome"
            name="nome"
            required
            placeholder="GESTÃO BRUNO E JESSICA"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Data de início" htmlFor="data_inicio">
            <input
              id="data_inicio"
              name="data_inicio"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
          </Field>
          <Field label="Valor mensal (R$)" htmlFor="valor_mensal">
            <input
              id="valor_mensal"
              name="valor_mensal"
              type="number"
              min="0"
              step="0.01"
              required
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Tráfego pago" htmlFor="trafego_pago">
          <select id="trafego_pago" name="trafego_pago" className={inputClass} defaultValue="">
            <option value="">—</option>
            <option value="SIM">SIM</option>
            <option value="NÃO">NÃO</option>
            <option value="PARADO">PARADO</option>
            <option value="EM IMPLEMENTAÇÃO">EM IMPLEMENTAÇÃO</option>
          </select>
        </Field>

        <Field label="Observações" htmlFor="observacoes">
          <textarea
            id="observacoes"
            name="observacoes"
            rows={3}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="rounded-xl border border-border bg-bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Mentorados
          </h2>
          <button
            type="button"
            onClick={() => setMentorados((m) => [...m, m.length])}
            className="text-sm text-accent hover:text-accent-hover"
          >
            + Adicionar
          </button>
        </div>

        {mentorados.map((key, i) => (
          <div key={key} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <Field label="Nome" htmlFor={`mentorado_nome_${key}`}>
              <input
                id={`mentorado_nome_${key}`}
                name="mentorado_nome"
                className={inputClass}
              />
            </Field>
            <Field label="Telefone" htmlFor={`mentorado_telefone_${key}`}>
              <input
                id={`mentorado_telefone_${key}`}
                name="mentorado_telefone"
                className={inputClass}
              />
            </Field>
            {mentorados.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setMentorados((m) => m.filter((_, idx) => idx !== i))
                }
                className="mb-1 h-fit rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-surface-hover"
              >
                Remover
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {isPending ? "Salvando…" : "Criar grupo"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent";
