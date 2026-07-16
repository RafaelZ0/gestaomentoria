import type {
  GrupoGestao,
  Pagamento,
  LancamentoFinanceiro,
} from "@/lib/database.types";

export interface ContribuicaoGrupo {
  grupoId: string;
  nome: string;
  valor: number;
}

export interface ClausulaDetalhe {
  grupoNome: string;
  valor: number;
  data: string;
}

export interface MesFinanceiro {
  ano: number;
  mes: number; // 1-12
  receitaEstimada: number;
  gruposDetalhe: ContribuicaoGrupo[];
  clausulas: number;
  clausulasDetalhe: ClausulaDetalhe[];
  receitasAvulsas: number;
  custosFixos: number;
  despesasAvulsas: number;
  receita: number;
  gasto: number;
  lucro: number;
}

function toDate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function overlapDays(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): number {
  const start = aStart > bStart ? aStart : bStart;
  const end = aEnd < bEnd ? aEnd : bEnd;
  const dias = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(dias, 0);
}

export function calcTabelaMensal(
  grupos: GrupoGestao[],
  pagamentos: Pagamento[],
  lancamentos: LancamentoFinanceiro[],
  custosFixosTotal: number
): MesFinanceiro[] {
  const hoje = new Date(new Date().toDateString());

  const gruposPorId = new Map(grupos.map((g) => [g.id, g]));

  const datasInicio = grupos.map((g) => toDate(g.data_inicio));
  const datasComPagamentos = pagamentos.map((p) => toDate(p.data));
  const datasComLancamentos = lancamentos.map((l) => toDate(l.data));
  const todasDatas = [...datasInicio, ...datasComPagamentos, ...datasComLancamentos];

  if (todasDatas.length === 0) return [];

  const primeiraData = new Date(
    Math.min(...todasDatas.map((d) => d.getTime()))
  );

  const meses: MesFinanceiro[] = [];
  let cursor = new Date(primeiraData.getFullYear(), primeiraData.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  while (cursor <= fim) {
    const ano = cursor.getFullYear();
    const mesIdx = cursor.getMonth();
    const inicioMes = new Date(ano, mesIdx, 1);
    const fimMes = new Date(ano, mesIdx + 1, 1);
    const diasNoMes = Math.round(
      (fimMes.getTime() - inicioMes.getTime()) / 86400000
    );

    let receitaEstimada = 0;
    const gruposDetalhe: ContribuicaoGrupo[] = [];
    for (const g of grupos) {
      const inicioGrupo = toDate(g.data_inicio);
      const fimGrupo = g.data_termino ? toDate(g.data_termino) : hoje;
      const dias = overlapDays(inicioGrupo, fimGrupo, inicioMes, fimMes);
      const valor = Number(g.valor_mensal) * (dias / diasNoMes);
      receitaEstimada += valor;
      if (valor > 0) {
        gruposDetalhe.push({ grupoId: g.id, nome: g.nome, valor });
      }
    }
    gruposDetalhe.sort((a, b) => b.valor - a.valor);

    const noMes = (d: Date) => d.getFullYear() === ano && d.getMonth() === mesIdx;

    const pagamentosClausulaDoMes = pagamentos.filter(
      (p) => p.tipo === "CLAUSULA_CANCELAMENTO" && noMes(toDate(p.data))
    );
    const clausulas = pagamentosClausulaDoMes.reduce(
      (acc, p) => acc + Number(p.valor),
      0
    );
    const clausulasDetalhe: ClausulaDetalhe[] = pagamentosClausulaDoMes.map(
      (p) => ({
        grupoNome: gruposPorId.get(p.grupo_id)?.nome ?? "Grupo removido",
        valor: Number(p.valor),
        data: p.data,
      })
    );

    const receitasAvulsas = lancamentos
      .filter((l) => l.tipo === "RECEITA" && noMes(toDate(l.data)))
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const despesasAvulsas = lancamentos
      .filter((l) => l.tipo === "DESPESA" && noMes(toDate(l.data)))
      .reduce((acc, l) => acc + Number(l.valor), 0);

    const receita = receitaEstimada + clausulas + receitasAvulsas;
    const gasto = custosFixosTotal + despesasAvulsas;

    meses.push({
      ano,
      mes: mesIdx + 1,
      receitaEstimada,
      gruposDetalhe,
      clausulas,
      clausulasDetalhe,
      receitasAvulsas,
      custosFixos: custosFixosTotal,
      despesasAvulsas,
      receita,
      gasto,
      lucro: receita - gasto,
    });

    cursor = new Date(ano, mesIdx + 1, 1);
  }

  return meses.reverse();
}
