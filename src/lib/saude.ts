export type StatusSaude = "ok" | "warn" | "alert";
export type TendenciaRoas = "subindo" | "caindo" | "estavel" | null;

// Diferença mínima de ROAS entre os dois últimos meses pra considerar uma
// tendência real (subindo/caindo) em vez de ruído (estável).
const LIMIAR_TENDENCIA_ROAS = 0.5;

export function calcTendenciaRoas(
  porMes: { mes: string; investimento: number; faturamento: number }[]
): TendenciaRoas {
  const ordenado = [...porMes].sort((a, b) => a.mes.localeCompare(b.mes));
  if (ordenado.length < 2) return null;

  const roas = (m: (typeof ordenado)[number]) =>
    m.investimento > 0 ? m.faturamento / m.investimento : null;

  const anterior = roas(ordenado[ordenado.length - 2]);
  const atual = roas(ordenado[ordenado.length - 1]);
  if (anterior === null || atual === null) return null;

  const diff = atual - anterior;
  if (Math.abs(diff) < LIMIAR_TENDENCIA_ROAS) return "estavel";
  return diff > 0 ? "subindo" : "caindo";
}

export function calcSaudeGrupo({
  diasSemReuniao,
  tendenciaRoas,
  processosIncompletos,
}: {
  diasSemReuniao: number | null;
  tendenciaRoas: TendenciaRoas;
  processosIncompletos: number;
}): { status: StatusSaude; flags: string[] } {
  const flags: string[] = [];

  const semSinal = diasSemReuniao === null || diasSemReuniao > 30;
  if (semSinal) {
    flags.push(
      diasSemReuniao === null
        ? "Nunca teve reunião"
        : `Sem reunião há ${diasSemReuniao} dias`
    );
  }
  if (tendenciaRoas === "caindo") flags.push("ROAS em queda");
  if (processosIncompletos > 0) {
    flags.push(
      `${processosIncompletos} processo${processosIncompletos === 1 ? "" : "s"} pendente${processosIncompletos === 1 ? "" : "s"}`
    );
  }

  const status: StatusSaude =
    flags.length >= 2 ? "alert" : flags.length === 1 ? "warn" : "ok";

  return { status, flags };
}
