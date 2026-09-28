import { StatusDot, sentenceCase, tomStatusGrupo, tomTrafego, type Tom } from "@/components/ui/StatusDot";

// Compatibilidade: as telas que ainda usam StatusBadge passam a mostrar o
// novo formato (ponto + texto em sentence case), sem etiqueta preenchida.
const TOM_POR_VARIANTE = {
  ok: "ok",
  alert: "danger",
  warn: "warn",
  neutral: "off",
  accent: "info",
  paused: "paused",
} as const satisfies Record<string, Tom>;

type Variant = keyof typeof TOM_POR_VARIANTE;

export function StatusBadge({ label, variant }: { label: string; variant: Variant }) {
  return (
    <StatusDot tom={TOM_POR_VARIANTE[variant]} className="text-[13.5px]">
      {sentenceCase(label)}
    </StatusDot>
  );
}

export function statusGrupoVariant(status: string): Variant {
  return tomStatusGrupo(status) === "ok" ? "ok" : "neutral";
}

export function trafegoPagoVariant(trafego: string | null): Variant {
  switch (tomTrafego(trafego)) {
    case "ok":
      return "ok";
    case "paused":
      return "paused";
    case "info":
      return "accent";
    default:
      return "neutral";
  }
}
