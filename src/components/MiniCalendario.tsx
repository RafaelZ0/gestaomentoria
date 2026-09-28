"use client";

import Link from "next/link";
import {
  gerarGradeMes,
  mesAnterior,
  proximoMes,
  formatMesAnoLongo,
} from "@/lib/calendario";

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
    <div className="w-full max-w-[260px] rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/agenda?data=${anterior.ano}-${String(anterior.mes).padStart(2, "0")}-01`}
          prefetch={false}
          className="rounded px-2 py-1 text-xs text-text-2 hover:bg-hover"
        >
          ‹
        </Link>
        <span className="text-xs font-medium text-text">
          {formatMesAnoLongo(ano, mes)}
        </span>
        <Link
          href={`/agenda?data=${proximo.ano}-${String(proximo.mes).padStart(2, "0")}-01`}
          prefetch={false}
          className="rounded px-2 py-1 text-xs text-text-2 hover:bg-hover"
        >
          ›
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {DIAS.map((d, i) => (
          <span key={i} className="text-text-2">
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
              className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full tabular-nums ${
                ehSelecionado
                  ? "bg-gold text-on-gold"
                  : ehHoje
                    ? "border border-gold text-gold"
                    : foraDoMes
                      ? "text-text-2/40 hover:bg-hover"
                      : "text-text hover:bg-hover"
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
