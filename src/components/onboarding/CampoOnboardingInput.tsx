"use client";

import {
  ORIGENS,
  num,
  texto,
  type CampoOnboarding,
  type OnboardingPrecisao,
  type OnboardingValores,
} from "@/lib/onboarding";

const inputClass =
  "campo w-full text-lg transition-colors placeholder:text-muted disabled:opacity-50";

const PRECISOES: [string, string][] = [
  ["exato", "Exato"],
  ["aprox", "Aproximado"],
  ["naosei", "Não sabe"],
];

export function CampoOnboardingInput({
  campo,
  respostas,
  precisao,
  onValor,
  onPrecisao,
}: {
  campo: CampoOnboarding;
  respostas: OnboardingValores;
  precisao: OnboardingPrecisao;
  onValor: (k: string, v: unknown) => void;
  onPrecisao: (k: string, p: string) => void;
}) {
  const f = campo;
  const v = respostas[f.k];
  const id = `campo_${f.k}`;
  const naoSabe = f.prec && precisao[f.k] === "naosei";
  const ehGrupo = f.t === "pills" || f.t === "multi" || f.t === "origem";

  let controle: React.ReactNode = null;

  if (f.t === "text") {
    controle = (
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={texto(v)}
        onChange={(e) => onValor(f.k, e.target.value)}
        className={inputClass}
      />
    );
  } else if (f.t === "textarea") {
    controle = (
      <textarea
        id={id}
        rows={4}
        value={texto(v)}
        onChange={(e) => onValor(f.k, e.target.value)}
        className={`${inputClass} min-h-28 resize-y leading-relaxed`}
      />
    );
  } else if (f.t === "date") {
    controle = (
      <input
        id={id}
        type="date"
        value={texto(v)}
        onChange={(e) => onValor(f.k, e.target.value)}
        className={inputClass}
      />
    );
  } else if (f.t === "number" || f.t === "money") {
    controle = (
      <div className="flex items-center rounded-lg border border-line bg-bg focus-within:border-gold">
        {f.t === "money" && <span className="pl-4 text-lg text-text-2">R$</span>}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          disabled={naoSabe}
          value={texto(v)}
          onChange={(e) => onValor(f.k, e.target.value)}
          className="w-full bg-transparent px-4 py-3 text-lg tabular-nums text-text outline-none disabled:opacity-50"
        />
        {f.suf && <span className="pr-4 text-base text-text-2">{f.suf}</span>}
      </div>
    );
  } else if (f.t === "range") {
    const n = num(v);
    controle = (
      <div className="flex items-center gap-4">
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={5}
          value={n ?? 50}
          onChange={(e) => onValor(f.k, Number(e.target.value))}
          className="h-2 flex-1 cursor-pointer"
        />
        <b className="min-w-16 text-right font-display text-2xl tabular-nums text-text">
          {n != null ? `${n}%` : "—"}
        </b>
      </div>
    );
  } else if (f.t === "pills" || f.t === "multi") {
    const selecionados = f.t === "multi" && Array.isArray(v) ? (v as string[]) : [];
    controle = (
      <div role="group" aria-label={f.q} className="flex flex-wrap gap-2">
        {(f.o ?? []).map((opcao) => {
          const ativo = f.t === "multi" ? selecionados.includes(opcao) : v === opcao;
          return (
            <button
              key={opcao}
              type="button"
              aria-pressed={ativo}
              onClick={() => {
                if (f.t === "multi") {
                  onValor(
                    f.k,
                    ativo ? selecionados.filter((x) => x !== opcao) : [...selecionados, opcao]
                  );
                } else {
                  onValor(f.k, ativo ? "" : opcao);
                }
              }}
              className={`rounded-full border px-4 py-2 text-base transition-colors ${
                ativo
                  ? "border-gold bg-gold font-medium text-on-gold"
                  : "border-line bg-bg text-text-2 hover:border-muted hover:text-text"
              }`}
            >
              {opcao}
            </button>
          );
        })}
      </div>
    );
  } else if (f.t === "origem") {
    const o = (v as Record<string, unknown>) || {};
    const soma = Object.values(o).reduce<number>((acc, x) => acc + (num(x) ?? 0), 0);
    controle = (
      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {ORIGENS.map((origem) => (
            <label key={origem} className="flex flex-col gap-1">
              <span className="text-sm text-text-2">{origem}</span>
              <div className="flex items-center rounded-lg border border-line bg-bg focus-within:border-gold">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={texto(o[origem])}
                  onChange={(e) => onValor(f.k, { ...o, [origem]: e.target.value })}
                  className="w-full bg-transparent px-3 py-2.5 text-lg tabular-nums text-text outline-none"
                />
                <span className="pr-3 text-text-2">%</span>
              </div>
            </label>
          ))}
        </div>
        {soma > 0 && (
          <p className={`mt-2 text-sm ${soma === 100 ? "text-ok" : "text-warn"}`}>
            Soma: {soma}%{soma !== 100 ? " (o ideal é somar 100%)" : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${f.wide ? "md:col-span-2" : ""}`}>
      {ehGrupo ? (
        <span className="text-base font-medium text-text">{f.q}</span>
      ) : (
        <label htmlFor={id} className="text-base font-medium text-text">
          {f.q}
        </label>
      )}
      {f.hint && <span className="-mt-1 text-sm text-text-2">{f.hint}</span>}
      {controle}
      {f.prec && (
        <div role="group" aria-label="Precisão" className="flex flex-wrap gap-1.5">
          {PRECISOES.map(([valor, rotulo]) => {
            const ativo = precisao[f.k] === valor;
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={ativo}
                onClick={() => onPrecisao(f.k, ativo ? "" : valor)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  ativo
                    ? "border-solid border-warn bg-warn/10 font-medium text-warn"
                    : "border-dashed border-line text-muted hover:text-text-2"
                }`}
              >
                {rotulo}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
