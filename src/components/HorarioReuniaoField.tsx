"use client";

import { useEffect, useState } from "react";
import { horariosPablo } from "@/lib/disponibilidadePablo";
import { buscarHorariosOcupadosPablo } from "@/app/actions/reunioes";

export function HorarioReuniaoField({
  data,
  ehPablo,
  pabloId,
}: {
  data: string;
  ehPablo: boolean;
  pabloId: string | null;
}) {
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [horaEscolhida, setHoraEscolhida] = useState("");

  useEffect(() => {
    setHoraEscolhida("");
    if (!ehPablo || !pabloId || !data) {
      setOcupados([]);
      return;
    }
    setCarregando(true);
    buscarHorariosOcupadosPablo(pabloId, data)
      .then(setOcupados)
      .finally(() => setCarregando(false));
  }, [ehPablo, pabloId, data]);

  if (!ehPablo) {
    return (
      <div>
        <label className="mb-1 block text-sm text-text-secondary">
          Horário (opcional)
        </label>
        <input
          type="time"
          name="hora"
          className="w-full rounded-lg border border-border bg-bg-surface-hover px-3 py-2 text-text-primary outline-none focus:border-accent"
        />
      </div>
    );
  }

  const disponiveis = data
    ? horariosPablo(data).filter((h) => !ocupados.includes(h))
    : [];

  return (
    <div>
      <label className="mb-1 block text-sm text-text-secondary">
        Horário (agenda do Pablo)
      </label>
      <input type="hidden" name="hora" value={horaEscolhida} />
      {!data ? (
        <p className="text-xs text-text-secondary">Escolha a data primeiro.</p>
      ) : carregando ? (
        <p className="text-xs text-text-secondary">Carregando horários…</p>
      ) : disponiveis.length === 0 ? (
        <p className="text-xs text-status-alert-text">
          Nenhum horário disponível nesse dia pela grade do Pablo.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {disponiveis.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHoraEscolhida(h)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                horaEscolhida === h
                  ? "border-accent bg-accent text-white"
                  : "border-border text-text-primary hover:bg-bg-surface-hover"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
