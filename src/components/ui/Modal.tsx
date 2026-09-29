"use client";

import { useEffect } from "react";

// Casca de modal: fundo escurecido, fecha com Esc ou clique fora.
export function Modal({
  titulo,
  onClose,
  children,
  largura = "max-w-lg",
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[calc(100dvh-2rem)] w-full ${largura} overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-2xl`}
      >
        <h2 className="mb-4 text-[17px] font-semibold text-text">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
