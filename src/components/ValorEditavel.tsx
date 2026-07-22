"use client";

import { useEffect, useState, useTransition } from "react";

export function ValorEditavel({
  label,
  valor,
  formatarExibicao,
  onSalvar,
  sufixo,
}: {
  label: string;
  valor: number;
  formatarExibicao: (v: number) => string;
  onSalvar: (novoValor: number) => Promise<void> | void;
  sufixo?: string;
}) {
  const [valorAtual, setValorAtual] = useState(valor);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(String(valor));
  const [isPending, startTransition] = useTransition();
  const [sucesso, setSucesso] = useState(false);

  // Mantém sincronizado se o valor mudar por outra via (ex: revalidação
  // trazendo dado mais recente do servidor).
  useEffect(() => {
    setValorAtual(valor);
  }, [valor]);

  function cancelar() {
    setTexto(String(valorAtual));
    setEditando(false);
  }

  function salvar() {
    const novoValor = Number(texto);
    if (!texto || Number.isNaN(novoValor)) {
      cancelar();
      return;
    }
    if (novoValor === valorAtual) {
      setEditando(false);
      return;
    }

    // Atualização otimista: reflete o novo valor na tela na hora, sem
    // esperar o round-trip do servidor. Reverte se a gravação falhar.
    const anterior = valorAtual;
    setValorAtual(novoValor);
    setEditando(false);
    setSucesso(true);
    setTimeout(() => setSucesso(false), 1500);

    startTransition(async () => {
      try {
        await onSalvar(novoValor);
      } catch {
        setValorAtual(anterior);
      }
    });
  }

  if (editando) {
    return (
      <div>
        <p className="text-sm text-text-secondary">{label}</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={texto}
            disabled={isPending}
            onChange={(e) => setTexto(e.target.value.replace(/[^0-9.]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvar();
              if (e.key === "Escape") cancelar();
            }}
            className="w-28 shrink-0 rounded-lg border border-border bg-bg-surface-hover px-2 py-1 font-display text-lg font-semibold tabular-nums text-text-primary outline-none"
          />
          {sufixo && (
            <span className="shrink-0 text-xs text-text-secondary">{sufixo}</span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={salvar}
            className="rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            Salvar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={cancelar}
            className="btn-secondary px-2.5 py-1 text-xs"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-text-secondary">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p
          className={`font-display text-xl font-semibold tracking-tight tabular-nums transition-colors ${
            sucesso ? "text-status-ok-text" : "text-text-primary"
          }`}
        >
          {formatarExibicao(valorAtual)}
        </p>
        <button
          type="button"
          onClick={() => {
            setTexto(String(valorAtual));
            setEditando(true);
          }}
          aria-label={`Editar ${label}`}
          title={`Editar ${label}`}
          className="text-text-secondary hover:text-text-primary"
        >
          ✎
        </button>
      </div>
    </div>
  );
}
