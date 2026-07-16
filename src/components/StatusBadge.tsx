const VARIANTS = {
  ok: "bg-status-ok-bg text-status-ok-text",
  alert: "bg-status-alert-bg text-status-alert-text",
  warn: "bg-status-warn-bg text-status-warn-text",
  neutral: "bg-status-neutral-bg text-status-neutral-text",
  accent: "bg-status-accent-bg text-status-accent-text",
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
