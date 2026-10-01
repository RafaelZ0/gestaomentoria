// Métrica solta na página (sem caixa): rótulo pequeno + número grande.
export function Metric({
  rotulo,
  children,
  tamanho = "md",
  tom,
}: {
  rotulo: React.ReactNode;
  children: React.ReactNode;
  tamanho?: "md" | "lg";
  tom?: "danger" | "warn" | "ok";
}) {
  const cor = tom === "danger" ? "text-danger" : tom === "warn" ? "text-warn" : tom === "ok" ? "text-ok" : "text-text";
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] text-muted">{rotulo}</span>
      <span
        className={`font-medium tabular-nums tracking-[-0.01em] ${cor} ${
          tamanho === "lg" ? "text-[28px] leading-tight" : "text-[22px] leading-tight"
        }`}
      >
        {children}
      </span>
    </div>
  );
}

// Linha rótulo/valor com divisória fina (listas tipo "Tráfego pago").
export function LinhaInfo({
  rotulo,
  children,
  empilhado = false,
}: {
  rotulo: React.ReactNode;
  children: React.ReactNode;
  empilhado?: boolean;
}) {
  if (empilhado) {
    return (
      <div className="flex flex-col gap-1.5 border-b border-line-soft py-3 text-[14.5px] last:border-b-0">
        <span className="text-muted">{rotulo}</span>
        <span className="whitespace-pre-line text-text">{children}</span>
      </div>
    );
  }
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line-soft py-3 text-[14.5px]">
      <span className="shrink-0 text-muted">{rotulo}</span>
      <span className="min-w-0 text-right text-text">{children}</span>
    </div>
  );
}

// Bloco de aviso em `surface` (único uso de fundo além dos controles).
export function Notice({
  titulo,
  children,
  acao,
}: {
  titulo: React.ReactNode;
  children?: React.ReactNode;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 rounded-xl bg-surface px-5 py-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[14.5px] font-medium text-text">{titulo}</span>
        {children && <span className="text-[13px] text-muted">{children}</span>}
      </div>
      {acao && <div className="shrink-0 text-sm">{acao}</div>}
    </div>
  );
}
