// Seta + percentual da variação em relação ao mês anterior. A cor depende
// do que é bom pra métrica: CPL subindo é ruim; ROAS, faturamento e vendas
// subindo é bom.
export function Tendencia({
  v,
  melhorQuandoMaior = true,
}: {
  v: number | null;
  melhorQuandoMaior?: boolean;
}) {
  if (v === null || !Number.isFinite(v)) return null;
  const pct = Math.round(v * 100);
  if (pct === 0) {
    return (
      <span className="ml-1.5 text-[12px] text-muted" title="Igual ao mês anterior">
        =
      </span>
    );
  }
  const subiu = pct > 0;
  const bom = subiu === melhorQuandoMaior;
  return (
    <span
      className={`ml-1.5 whitespace-nowrap text-[12px] tabular-nums ${bom ? "text-ok" : "text-danger"}`}
      title="Em relação ao mês anterior com lançamento"
    >
      {subiu ? "↑" : "↓"}
      {Math.abs(pct)}%
    </span>
  );
}
