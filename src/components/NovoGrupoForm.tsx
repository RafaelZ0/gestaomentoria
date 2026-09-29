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
      className="flex flex-col gap-10"
    >
      {error && (
        <div className="text-sm text-danger">
          {error}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-[15px] font-semibold text-text">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <option value="SIM">Sim</option>
            <option value="NÃO">Não</option>
            <option value="PARADO">Parado</option>
            <option value="EM IMPLEMENTAÇÃO">Em implementação</option>
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
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-text">
            Mentorados
          </h2>
          <button
            type="button"
            onClick={() => setMentorados((m) => [...m, m.length])}
            className="link text-[13.5px]"
          >
            Adicionar
          </button>
        </div>

        {mentorados.map((key, i) => (
          <div
            key={key}
            className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
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
                className="btn-secondary"
              >
                Remover
              </button>
            )}
          </div>
        ))}
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-fit"
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
      <label htmlFor={htmlFor} className="rotulo mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "campo w-full";
