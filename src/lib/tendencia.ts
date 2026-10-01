// Variação de uma métrica em relação ao mês anterior. "Mês anterior" = o
// último mês que teve lançamento (mesma lógica da tendência de ROAS da
// saúde do cliente). Sempre calculado, nunca gravado.

export function variacao(atual: number | null, anterior: number | null): number | null {
  if (atual === null || anterior === null || anterior === 0) return null;
  return (atual - anterior) / Math.abs(anterior);
}

export type MetricasMes = {
  investimento: number;
  leads: number;
  vendas: number;
  faturamento: number;
};

export function cplDe(m: MetricasMes): number | null {
  return m.leads > 0 ? m.investimento / m.leads : null;
}

export function roasDe(m: MetricasMes): number | null {
  return m.investimento > 0 ? m.faturamento / m.investimento : null;
}

export type VariacoesMes = {
  cpl: number | null;
  roas: number | null;
  faturamento: number | null;
  vendas: number | null;
};

export function variacoesEntre(atual: MetricasMes, anterior: MetricasMes | null): VariacoesMes {
  if (!anterior) return { cpl: null, roas: null, faturamento: null, vendas: null };
  return {
    cpl: variacao(cplDe(atual), cplDe(anterior)),
    roas: variacao(roasDe(atual), roasDe(anterior)),
    faturamento: variacao(atual.faturamento, anterior.faturamento),
    vendas: variacao(atual.vendas, anterior.vendas),
  };
}
