"use client";

import { useEffect, useState } from "react";

export type AcaoMenu = {
  label: string;
  onSelect: () => void | Promise<unknown>;
  destrutiva?: boolean;
  // Ações destrutivas pedem confirmação antes de executar.
  confirmar?: { titulo: string; texto?: string; botao: string };
};

// Menu "⋯" de uma linha: tira da tela as ações secundárias/destrutivas.
export function RowMenu({ acoes, rotulo }: { acoes: AcaoMenu[]; rotulo: string }) {
  const [aberto, setAberto] = useState(false);
  const [pendente, setPendente] = useState<AcaoMenu | null>(null);
  const [executando, setExecutando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto]);

  async function executar(acao: AcaoMenu) {
    setExecutando(true);
    try {
      await acao.onSelect();
    } finally {
      setExecutando(false);
      setPendente(null);
    }
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={rotulo}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-lg leading-none text-subtle hover:bg-hover hover:text-text"
      >
        ⋯
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 min-w-44 rounded-xl border border-line bg-surface p-1.5 shadow-2xl"
          >
            {acoes.map((a) => (
              <button
                key={a.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setAberto(false);
                  if (a.confirmar) setPendente(a);
                  else void executar(a);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-hover ${
                  a.destrutiva ? "text-danger" : "text-text-2 hover:text-text"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}

      {pendente?.confirmar && (
        <ConfirmDialog
          titulo={pendente.confirmar.titulo}
          texto={pendente.confirmar.texto}
          botao={pendente.confirmar.botao}
          destrutiva={pendente.destrutiva}
          executando={executando}
          onConfirmar={() => void executar(pendente)}
          onCancelar={() => setPendente(null)}
        />
      )}
    </div>
  );
}

export function ConfirmDialog({
  titulo,
  texto,
  botao,
  destrutiva = true,
  executando = false,
  onConfirmar,
  onCancelar,
  children,
}: {
  titulo: string;
  texto?: string;
  botao: string;
  destrutiva?: boolean;
  executando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancelar]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
      onClick={onCancelar}
    >
      <div
        role="alertdialog"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-2xl"
      >
        <h2 className="text-[15px] font-semibold text-text">{titulo}</h2>
        {texto && <p className="mt-1.5 text-sm text-text-2">{texto}</p>}
        {children}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancelar} disabled={executando} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={executando}
            className={
              destrutiva
                ? "inline-flex h-[38px] items-center rounded-[10px] bg-danger px-4 text-sm font-semibold text-on-gold hover:opacity-90 disabled:opacity-60"
                : "btn-primary"
            }
          >
            {executando ? "Aguarde…" : botao}
          </button>
        </div>
      </div>
    </div>
  );
}
