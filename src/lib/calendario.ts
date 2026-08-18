function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Grade do mês em semanas de 6 colunas (Segunda a Sábado — domingo não
// existe na grade de trabalho do Pablo, então nem aparece). Inclui dias do
// mês anterior/seguinte pra completar a primeira/última semana.
export function gerarGradeMes(ano: number, mesIdx0: number): string[][] {
  const primeiroDia = new Date(ano, mesIdx0, 1);
  const ultimoDia = new Date(ano, mesIdx0 + 1, 0);

  const inicio = new Date(primeiroDia);
  const diaSemanaInicio = inicio.getDay(); // 0=domingo…6=sábado
  const voltarAteSegunda = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;
  inicio.setDate(inicio.getDate() - voltarAteSegunda);

  const fim = new Date(ultimoDia);
  while (fim.getDay() !== 6) {
    fim.setDate(fim.getDate() + 1);
  }

  const dias: string[] = [];
  const cursor = new Date(inicio);
  while (cursor <= fim) {
    if (cursor.getDay() !== 0) dias.push(toISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const semanas: string[][] = [];
  for (let i = 0; i < dias.length; i += 6) {
    semanas.push(dias.slice(i, i + 6));
  }
  return semanas;
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
