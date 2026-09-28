// Status = ponto colorido de 7px + texto em sentence case. Cor forte no
// texto só para o que pede ação (danger/warn).
export type Tom = "ok" | "paused" | "off" | "info" | "danger" | "warn" | "gold";

const PONTO: Record<Tom, string> = {
  ok: "bg-ok",
  paused: "bg-paused",
  off: "bg-off",
  info: "bg-info",
  danger: "bg-danger",
  warn: "bg-warn",
  gold: "bg-gold",
};

const TEXTO_FORTE: Partial<Record<Tom, string>> = {
  danger: "text-danger",
  warn: "text-warn",
};

export function sentenceCase(s: string): string {
  const baixo = s.toLocaleLowerCase("pt-BR");
  return baixo.charAt(0).toLocaleUpperCase("pt-BR") + baixo.slice(1);
}

export function StatusDot({
  tom,
  children,
  className = "",
}: {
  tom: Tom;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${TEXTO_FORTE[tom] ?? "text-text-2"} ${className}`}
    >
      <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${PONTO[tom]}`} />
      {children}
    </span>
  );
}

export function tomStatusGrupo(status: string): Tom {
  return status === "Ativo" ? "ok" : "off";
}

export function tomTrafego(trafego: string | null): Tom {
  switch (trafego) {
    case "SIM":
      return "ok";
    case "PARADO":
      return "paused";
    case "EM IMPLEMENTAÇÃO":
      return "info";
    default:
      return "off";
  }
}
