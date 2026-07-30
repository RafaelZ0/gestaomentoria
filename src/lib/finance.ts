import type {
  GrupoGestao,
  Pagamento,
  LancamentoFinanceiro,
} from "@/lib/database.types";

export interface PagamentoDetalhe {
  grupoNome: string;
  valor: number;
  data: string;
  viaAsaas: boolean;
}

export interface ClausulaDetalhe {
  grupoNome: string;
  valor: number;
  data: string;
}

export interface VendaDetalhe {
  grupoNome: string;
  valor: number;
}

export interface CustoFixoMensalItemDetalhe {
  id: string;
  nome: string;
  valor: number;
}

export interface MesFinanceiro {
  ano: number;
  mes: number; // 1-12
  mensalidadesDetalhe: PagamentoDetalhe[];
  clausulas: number;
  clausulasDetalhe: ClausulaDetalhe[];
  receitasAvulsas: number;
  entrada: number;
  faturamento: number;
  vendasDetalhe: VendaDetalhe[];
  custosFixos: number;
  custosFixosManual: boolean;
  custosFixosItens: CustoFixoMensalItemDetalhe[];
  despesasAvulsas: number;
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
  itensCustosFixosMensais: Map<string, CustoFixoMensalItemDetalhe[]> = new Map()
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
    const noMes = (d: Date) => d.getFullYear() === ano && d.getMonth() === mesIdx;

    const pagamentosMensalidadeDoMes = pagamentos.filter(
      (p) => p.tipo === "MENSALIDADE" && noMes(toDate(p.data))
    );
    const mensalidadesDetalhe: PagamentoDetalhe[] = pagamentosMensalidadeDoMes.map(
      (p) => ({
        grupoNome: gruposPorId.get(p.grupo_id)?.nome ?? "Grupo removido",
        valor: Number(p.valor),
        data: p.data,
        viaAsaas: !!p.asaas_payment_id,
      })
    );
    const totalMensalidades = mensalidadesDetalhe.reduce(
      (acc, m) => acc + m.valor,
      0
    );

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

    // Faturamento = valor total vendido (acompanhamento fechado nesse mês),
    // independente de como/quando o dinheiro efetivamente entra depois.
    const gruposVendidosNoMes = grupos.filter((g) => noMes(toDate(g.data_inicio)));
    const vendasDetalhe: VendaDetalhe[] = gruposVendidosNoMes.map((g) => ({
      grupoNome: g.nome,
      valor: Number(g.valor_mensal) * 12,
    }));
    const faturamento = vendasDetalhe.reduce((acc, v) => acc + v.valor, 0);

    const chaveOverride = `${ano}-${mesIdx + 1}`;
    const custosFixosItens = itensCustosFixosMensais.get(chaveOverride) ?? [];
    const custosFixosManual = custosFixosItens.length > 0;
    const custosFixos = custosFixosManual
      ? custosFixosItens.reduce((acc, i) => acc + i.valor, 0)
      : custosFixosAtual;

    const entrada = totalMensalidades + clausulas + receitasAvulsas;
    const gasto = custosFixos + despesasAvulsas;

    meses.push({
      ano,
      mes: mesIdx + 1,
      mensalidadesDetalhe,
      clausulas,
      clausulasDetalhe,
      receitasAvulsas,
      entrada,
      faturamento,
      vendasDetalhe,
      custosFixos,
      custosFixosManual,
      custosFixosItens,
      despesasAvulsas,
      gasto,
      lucro: entrada - gasto,
    });

    cursor = new Date(ano, mesIdx + 1, 1);
  }

  return meses.reverse();
}
