"use client";

import Link from "next/link";
import {
  gerarGradeMes,
  mesAnterior,
  proximoMes,
  formatMesAnoLongo,
} from "@/lib/calendario";
import { Icon } from "@/components/ui/Icon";

const DIAS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function MiniCalendario({
  ano,
  mes,
  dataSelecionada,
  hoje,
}: {
  ano: number;
  mes: number;
  dataSelecionada: string;
  hoje: string;
}) {
  const semanas = gerarGradeMes(ano, mes - 1);
  const anterior = mesAnterior(ano, mes);
  const proximo = proximoMes(ano, mes);

  return (
    <div className="w-full max-w-[240px] px-1">
      <div className="flex items-center justify-between">
        <span className="pl-1 text-[13.5px] font-medium text-text">
          {formatMesAnoLongo(ano, mes)}
        </span>
        <div className="flex">
          <Link
            href={`/agenda?data=${anterior.ano}-${String(anterior.mes).padStart(2, "0")}-01`}
            prefetch={false}
            aria-label="Mês anterior"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text"
          >
            <Icon nome="chevronEsquerda" tamanho={15} />
          </Link>
          <Link
            href={`/agenda?data=${proximo.ano}-${String(proximo.mes).padStart(2, "0")}-01`}
            prefetch={false}
            aria-label="Próximo mês"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text"
          >
            <Icon nome="chevronDireita" tamanho={15} />
          </Link>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-[11.5px]">
        {DIAS.map((d, i) => (
          <span key={i} className="pb-1 text-subtle">
            {d}
          </span>
        ))}
        {semanas.flat().map((diaISO) => {
          const [, mesDoDia, dia] = diaISO.split("-").map(Number);
          const foraDoMes = mesDoDia !== mes;
          const ehHoje = diaISO === hoje;
          const ehSelecionado = diaISO === dataSelecionada;

          return (
            <Link
              key={diaISO}
              href={`/agenda?data=${diaISO}`}
              prefetch={false}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full tabular-nums transition-colors ${
                ehSelecionado
                  ? `bg-raised font-medium ${ehHoje ? "text-gold" : "text-text"}`
                  : ehHoje
                    ? "font-medium text-gold hover:bg-hover"
                    : foraDoMes
                      ? "text-off hover:bg-hover"
                      : "text-text-2 hover:bg-hover hover:text-text"
              }`}
            >
              {dia}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
