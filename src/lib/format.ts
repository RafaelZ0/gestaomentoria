export function formatBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

export function calcDuracaoDias(
  dataInicio: string,
  dataTermino: string | null
): number {
  const inicio = new Date(dataInicio + "T00:00:00");
  const fim = dataTermino
    ? new Date(dataTermino + "T00:00:00")
    : new Date(new Date().toDateString());
  const dias = Math.floor(
    (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(dias, 0);
}

export function calcFaturamentoEstimado(
  valorMensal: number,
  dataInicio: string,
  dataTermino: string | null
): number {
  const dias = calcDuracaoDias(dataInicio, dataTermino);
  return valorMensal * (dias / 30);
}

export function formatDuracao(dias: number): string {
  const meses = Math.floor(dias / 30);
  const diasRestantes = dias % 30;
  if (meses === 0) return `${dias} dia${dias === 1 ? "" : "s"}`;
  if (diasRestantes === 0) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  return `${meses} ${meses === 1 ? "mês" : "meses"} e ${diasRestantes} dia${
    diasRestantes === 1 ? "" : "s"
  }`;
}
