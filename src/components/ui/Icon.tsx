// Ícones de traço fino (os mesmos desenhos das telas de referência em
// docs/repaginacao/referencia). Um conjunto só, sem dependência externa.

const CAMINHOS = {
  painel: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M9 4v16" />
    </>
  ),
  mais: <path d="M12 5v14M5 12h14" />,
  grupos: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16 14.6c2.3.1 3.9 1.5 4.5 4.4" />
    </>
  ),
  reunioes: <path d="M4 6h16v10H9l-5 4z" />,
  agenda: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  financas: <path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6" />,
  resultados: <path d="M6 20V11M12 20V5M18 20v-6" />,
  processos: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
    </>
  ),
  custo: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v9M14.6 9.6c-.5-.8-1.5-1.2-2.6-1.2-1.4 0-2.5.7-2.5 1.8 0 2.6 5.3 1.2 5.3 3.8 0 1.1-1.2 1.9-2.8 1.9-1.2 0-2.3-.5-2.8-1.3" />
    </>
  ),
  avisos: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  busca: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4-4" />
    </>
  ),
  seletor: <path d="M8 10l4-4 4 4M8 14l4 4 4-4" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  fechar: <path d="M6 6l12 12M18 6L6 18" />,
  ajuda: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6" />
      <path d="M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  externo: <path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4" />,
  chevronEsquerda: <path d="M14.5 6l-6 6 6 6" />,
  chevronDireita: <path d="M9.5 6l6 6-6 6" />,
  chevronBaixo: <path d="M6 9.5l6 6 6-6" />,
  sair: <path d="M15 12H4M8 8l-4 4 4 4M13 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />,
} as const;

export type NomeIcone = keyof typeof CAMINHOS;

export function Icon({
  nome,
  tamanho = 18,
  traco = 1.6,
  className,
}: {
  nome: NomeIcone;
  tamanho?: number;
  traco?: number;
  className?: string;
}) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={traco}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className ?? ""}`}
    >
      {CAMINHOS[nome]}
    </svg>
  );
}
