"use client";

// Controle segmentado (ex.: Ativos · Inativos · Todos). Fundo `surface`,
// opção selecionada em `raised`.
export function Segmented<T extends string>({
  opcoes,
  valor,
  onChange,
  rotulo,
}: {
  opcoes: { valor: T; label: string }[];
  valor: T;
  onChange: (v: T) => void;
  rotulo: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex gap-1 rounded-[10px] bg-surface p-[3px]">
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => onChange(o.valor)}
            className={`h-[30px] rounded-lg px-3.5 text-[13.5px] transition-colors ${
              ativo ? "bg-raised text-text" : "text-muted hover:text-text"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
