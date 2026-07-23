"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatBRL } from "@/lib/format";

type PontoMensal = {
  mes: string;
  faturamento: number;
  roas: number | null;
  cpl: number | null;
};

const COR_LINHA = "#6366f1";
const COR_GRID = "#232838";
const COR_EIXO = "#a8b0c4";

function mesCurto(mes: string) {
  const [ano, m] = mes.split("-").map(Number);
  return new Date(ano, m - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    .replace(".", "");
}

function TooltipCustom({
  active,
  payload,
  label,
  formatar,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  formatar: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-xs shadow-lg">
      <p className="text-text-secondary">{mesCurto(label ?? "")}</p>
      <p className="font-medium text-text-primary">
        {formatar(payload[0].value)}
      </p>
    </div>
  );
}

function GraficoLinha({
  titulo,
  dados,
  campo,
  formatar,
}: {
  titulo: string;
  dados: PontoMensal[];
  campo: "faturamento" | "roas" | "cpl";
  formatar: (v: number) => string;
}) {
  const temDado = dados.some((d) => d[campo] !== null);

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-4">
      <p className="text-sm text-text-secondary">{titulo}</p>
      {!temDado ? (
        <div className="flex h-[180px] items-center justify-center text-sm text-text-secondary">
          Sem dados suficientes
        </div>
      ) : (
        <div className="mt-2 h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid
                stroke={COR_GRID}
                strokeDasharray="0"
                vertical={false}
              />
              <XAxis
                dataKey="mes"
                tickFormatter={mesCurto}
                stroke={COR_GRID}
                tick={{ fill: COR_EIXO, fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                stroke={COR_GRID}
                tick={{ fill: COR_EIXO, fontSize: 11 }}
                tickLine={false}
                width={44}
                tickFormatter={(v) =>
                  campo === "roas" ? `${v}x` : formatar(v).replace("R$", "")
                }
              />
              <Tooltip
                content={<TooltipCustom formatar={formatar} />}
                cursor={{ stroke: COR_GRID }}
              />
              <Line
                type="monotone"
                dataKey={campo}
                stroke={COR_LINHA}
                strokeWidth={2}
                dot={{ r: 3, fill: COR_LINHA, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function EvolucaoResultadosChart({ dados }: { dados: PontoMensal[] }) {
  if (dados.length < 2) return null;

  return (
    <div>
      <h2 className="mb-2 font-display text-lg font-semibold text-text-primary">
        Evolução mensal
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GraficoLinha
          titulo="Faturamento"
          dados={dados}
          campo="faturamento"
          formatar={formatBRL}
        />
        <GraficoLinha
          titulo="ROAS"
          dados={dados}
          campo="roas"
          formatar={(v) => `${v.toFixed(1)}x`}
        />
        <GraficoLinha
          titulo="CPL"
          dados={dados}
          campo="cpl"
          formatar={formatBRL}
        />
      </div>
    </div>
  );
}
