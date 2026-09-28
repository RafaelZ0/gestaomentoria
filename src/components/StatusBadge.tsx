const VARIANTS = {
  ok: "bg-ok/10 text-ok",
  alert: "bg-danger/10 text-danger",
  warn: "bg-warn/10 text-warn",
  neutral: "bg-off/10 text-muted",
  accent: "bg-gold/10 text-gold",
} as const;

type Variant = keyof typeof VARIANTS;

export function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${VARIANTS[variant]}`}
    >
      {label}
    </span>
  );
}

export function statusGrupoVariant(status: string): Variant {
  return status === "Ativo" ? "ok" : "alert";
}

export function trafegoPagoVariant(trafego: string | null): Variant {
  switch (trafego) {
    case "SIM":
      return "ok";
    case "PARADO":
      return "warn";
    case "EM IMPLEMENTAÇÃO":
      return "accent";
    case "NÃO":
    default:
      return "neutral";
  }
}
