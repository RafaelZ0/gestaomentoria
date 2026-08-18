function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Grade do mês (mini-calendário), semanas de 7 colunas Domingo-Sábado,
// padrão de calendário comum. Inclui dias do mês anterior/seguinte pra
// completar a primeira/última semana.
export function gerarGradeMes(ano: number, mesIdx0: number): string[][] {
  const primeiroDia = new Date(ano, mesIdx0, 1);
  const ultimoDia = new Date(ano, mesIdx0 + 1, 0);

  const inicio = new Date(primeiroDia);
  inicio.setDate(inicio.getDate() - inicio.getDay());

  const fim = new Date(ultimoDia);
  fim.setDate(fim.getDate() + (6 - fim.getDay()));

  const dias: string[] = [];
  const cursor = new Date(inicio);
  while (cursor <= fim) {
    dias.push(toISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const semanas: string[][] = [];
  for (let i = 0; i < dias.length; i += 7) {
    semanas.push(dias.slice(i, i + 7));
  }
  return semanas;
}

// Os 7 dias (Domingo a Sábado) da semana que contém `dataISO`.
export function diasDaSemana(dataISO: string): string[] {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const cursor = new Date(ano, mes - 1, dia);
  cursor.setDate(cursor.getDate() - cursor.getDay());

  const dias: string[] = [];
  for (let i = 0; i < 7; i++) {
    dias.push(toISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

export function somarDias(dataISO: string, dias: number): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const d = new Date(ano, mes - 1, dia);
  d.setDate(d.getDate() + dias);
  return toISO(d);
}

export function mesAnterior(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

export function proximoMes(ano: number, mes: number): { ano: number; mes: number } {
  return mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 };
}

export function formatMesAnoLongo(ano: number, mes: number): string {
  const nome = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export function formatDiaSemanaCurto(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const nome = new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", {
    weekday: "short",
  });
  return nome.charAt(0).toUpperCase() + nome.slice(1, 3).replace(".", "");
}

export function formatDiaMesCurto(dataISO: string): string {
  const [, mes, dia] = dataISO.split("-").map(Number);
  return `${dia}/${String(mes).padStart(2, "0")}`;
}
