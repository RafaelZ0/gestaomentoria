import { datasVencimento } from "@/lib/format";

export type StatusMensalidade = "Pago" | "Pendente" | "Atrasado";

export function calcUltimoVencimento(
  dataInicio: string,
  dataTermino: string | null
): string | null {
  const datas = datasVencimento(
    new Date(dataInicio + "T00:00:00"),
    dataTermino
      ? new Date(dataTermino + "T00:00:00")
      : new Date(new Date().toDateString())
  );
  return datas.length > 0
    ? datas[datas.length - 1].toISOString().slice(0, 10)
    : null;
}

// O vencimento mais recente é a cobrança do ciclo atual: fica "Pendente"
// até ser paga. Qualquer vencimento anterior a esse ainda não pago já
// entrou no próximo ciclo sem ser quitado, então conta como "Atrasado".
export function statusMensalidade(
  dataVencimento: string,
  ultimoVencimento: string | null,
  pago: boolean
): StatusMensalidade {
  if (pago) return "Pago";
  return dataVencimento === ultimoVencimento ? "Pendente" : "Atrasado";
}

// Resumo de um grupo: pior status entre todos os vencimentos já gerados
// (Atrasado > Pendente > Pago), pra sinalizar de forma visível se existe
// alguma mensalidade em aberto, não só a do ciclo atual.
export function resumoStatusMensalidades(
  dataInicio: string,
  dataTermino: string | null,
  pagas: Set<string>
): StatusMensalidade | null {
  const datas = datasVencimento(
    new Date(dataInicio + "T00:00:00"),
    dataTermino
      ? new Date(dataTermino + "T00:00:00")
      : new Date(new Date().toDateString())
  ).map((d) => d.toISOString().slice(0, 10));

  if (datas.length === 0) return null;

  const ultimoVencimento = datas[datas.length - 1];
  const statusPorData = datas.map((d) =>
    statusMensalidade(d, ultimoVencimento, pagas.has(d))
  );

  if (statusPorData.includes("Atrasado")) return "Atrasado";
  if (statusPorData.includes("Pendente")) return "Pendente";
  return "Pago";
}
