"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AgendarReuniaoModal } from "@/components/AgendarReuniaoModal";

type AbrirAgendamento = (grupoId?: string) => void;

const AgendamentoContext = createContext<AbrirAgendamento | null>(null);

// Um único modal de agendamento (o mesmo da Agenda), aberto de qualquer
// lugar: Avisos, Agenda, cabeçalho do grupo, busca rápida.
export function AgendamentoProvider({
  grupos,
  responsaveis,
  pabloId,
  hoje,
  children,
}: {
  grupos: { id: string; nome: string }[];
  responsaveis: { id: string; nome: string }[];
  pabloId: string | null;
  hoje: string;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState<{ grupoId: string } | null>(null);
  const abrir = useCallback<AbrirAgendamento>((grupoId) => setAberto({ grupoId: grupoId ?? "" }), []);

  return (
    <AgendamentoContext.Provider value={abrir}>
      {children}
      {aberto && (
        <AgendarReuniaoModal
          key={aberto.grupoId}
          dataInicial={hoje}
          horaInicial=""
          responsavelInicial=""
          grupoInicial={aberto.grupoId}
          hoje={hoje}
          grupos={grupos}
          responsaveis={responsaveis}
          pabloId={pabloId}
          reunioesPorData={{}}
          onClose={() => setAberto(null)}
        />
      )}
    </AgendamentoContext.Provider>
  );
}

export function useAgendamento(): AbrirAgendamento {
  const abrir = useContext(AgendamentoContext);
  if (!abrir) throw new Error("useAgendamento fora do AgendamentoProvider");
  return abrir;
}

// Botão "Agendar" pronto pra listas (Avisos, Agenda, "quem precisa agendar").
export function BotaoAgendar({
  grupoId,
  className = "link text-[13.5px]",
  onAbrir,
}: {
  grupoId: string;
  className?: string;
  onAbrir?: () => void;
}) {
  const abrir = useAgendamento();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAbrir?.();
        abrir(grupoId);
      }}
      className={className}
    >
      Agendar
    </button>
  );
}
