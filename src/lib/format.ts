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

export function addMonths(data: Date, meses: number): Date {
  const alvo = new Date(data.getFullYear(), data.getMonth() + meses, 1);
  const ultimoDiaDoMesAlvo = new Date(
    alvo.getFullYear(),
    alvo.getMonth() + 1,
    0
  ).getDate();
  alvo.setDate(Math.min(data.getDate(), ultimoDiaDoMesAlvo));
  return alvo;
}

// Datas em que a mensalidade vence: na própria data de início (pagamento de
// entrada), e a cada mês seguinte, até (e incluindo) `fim`.
export function datasVencimento(dataInicio: Date, fim: Date): Date[] {
  const vencimentos: Date[] = [];
  let cursor = new Date(
    dataInicio.getFullYear(),
    dataInicio.getMonth(),
    dataInicio.getDate()
  );
  while (cursor <= fim) {
    vencimentos.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return vencimentos;
}

export function calcFaturamentoEstimado(
  valorMensal: number,
  dataInicio: string,
  dataTermino: string | null
): number {
  const inicio = new Date(dataInicio + "T00:00:00");
  const fim = dataTermino
    ? new Date(dataTermino + "T00:00:00")
    : new Date(new Date().toDateString());
  const qtdVencimentos = datasVencimento(inicio, fim).length;
  return valorMensal * qtdVencimentos;
}

export function formatMesAno(ano: number, mes: number): string {
  const nome = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
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
