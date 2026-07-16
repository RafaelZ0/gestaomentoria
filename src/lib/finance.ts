import { datasVencimento } from "@/lib/format";
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
  custosFixosManual: boolean;
  despesasAvulsas: number;
  receita: number;
  gasto: number;
  lucro: number;
}

function toDate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

export function calcTabelaMensal(
  grupos: GrupoGestao[],
  pagamentos: Pagamento[],
  lancamentos: LancamentoFinanceiro[],
  custosFixosAtual: number,
  overridesCustosFixos: Map<string, number> = new Map()
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

  // Pré-calcula, para cada grupo, os meses em que uma mensalidade vence
  // (um mês após o início, e a cada mês seguinte).
  const receitaPorMes = new Map<string, ContribuicaoGrupo[]>();
  for (const g of grupos) {
    const inicioGrupo = toDate(g.data_inicio);
    const fimGrupo = g.data_termino ? toDate(g.data_termino) : hoje;
    for (const venc of datasVencimento(inicioGrupo, fimGrupo)) {
      const chave = `${venc.getFullYear()}-${venc.getMonth()}`;
      const lista = receitaPorMes.get(chave) ?? [];
      lista.push({
        grupoId: g.id,
        nome: g.nome,
        valor: Number(g.valor_mensal),
      });
      receitaPorMes.set(chave, lista);
    }
  }

  const meses: MesFinanceiro[] = [];
  let cursor = new Date(primeiraData.getFullYear(), primeiraData.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  while (cursor <= fim) {
    const ano = cursor.getFullYear();
    const mesIdx = cursor.getMonth();
    const chaveMes = `${ano}-${mesIdx}`;

    const gruposDetalhe = receitaPorMes.get(chaveMes) ?? [];
    const receitaEstimada = gruposDetalhe.reduce((acc, g) => acc + g.valor, 0);

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

    const chaveOverride = `${ano}-${mesIdx + 1}`;
    const overrideCustosFixos = overridesCustosFixos.get(chaveOverride);
    const custosFixos = overrideCustosFixos ?? custosFixosAtual;

    const receita = receitaEstimada + clausulas + receitasAvulsas;
    const gasto = custosFixos + despesasAvulsas;

    meses.push({
      ano,
      mes: mesIdx + 1,
      receitaEstimada,
      gruposDetalhe,
      clausulas,
      clausulasDetalhe,
      receitasAvulsas,
      custosFixos,
      custosFixosManual: overrideCustosFixos !== undefined,
      despesasAvulsas,
      receita,
      gasto,
      lucro: receita - gasto,
    });

    cursor = new Date(ano, mesIdx + 1, 1);
  }

  return meses.reverse();
}
