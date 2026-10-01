"use client";

import { useState, useTransition } from "react";
import { toggleEntrega, updateEntregaData } from "@/app/actions/entregas";
import { displayProcessName, formatDate } from "@/lib/format";

export interface EntregaItem {
  id: string;
  nome: string;
  feito: boolean;
  data_feito: string | null;
}

// Marcar/desmarcar continua direto no checkbox (é a ação da lista). As
// datas de conclusão seguem o padrão Editar → Salvar.
export function ChecklistEntregas({
  grupoId,
  entregas,
}: {
  grupoId: string;
  entregas: EntregaItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [datas, setDatas] = useState<Record<string, string>>({});

  const temFeitas = entregas.some((e) => e.feito);

  function abrirEdicao() {
    setDatas(Object.fromEntries(entregas.map((e) => [e.id, e.data_feito ?? ""])));
    setEditando(true);
  }

  function salvarDatas() {
    const alteradas = entregas.filter(
      (e) => e.feito && datas[e.id] && datas[e.id] !== (e.data_feito ?? "")
    );
    startTransition(async () => {
      for (const e of alteradas) await updateEntregaData(grupoId, e.id, datas[e.id]);
      setEditando(false);
    });
  }

  return (
    <section className="flex flex-col">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-text">Checklist de entregas</h2>
        {temFeitas &&
          (editando ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditando(false)}
                disabled={isPending}
                className="btn-secondary h-8 px-3 text-[13px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarDatas}
                disabled={isPending}
                className="btn-secondary h-8 px-3 text-[13px]"
              >
                {isPending ? "Salvando…" : "Salvar"}
              </button>
            </div>
          ) : (
            <button type="button" onClick={abrirEdicao} className="link text-[13.5px]">
              Editar datas
            </button>
          ))}
      </div>

      {entregas.length === 0 ? (
        <p className="py-3 text-sm text-muted">Nenhum tipo de entrega cadastrado ainda.</p>
      ) : (
        entregas.map((e) => (
          <div
            key={e.id}
            className="flex min-h-12 items-center justify-between gap-4 border-b border-line-soft py-1.5 text-[14.5px]"
          >
            {/* Destaque no que falta fazer: pendente com contorno dourado e
                texto normal; feito fica discreto. */}
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={e.feito}
                disabled={isPending || editando}
                onChange={(ev) =>
                  startTransition(() => toggleEntrega(grupoId, e.id, ev.target.checked))
                }
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold ${
                  e.feito ? "border-raised bg-raised text-muted" : "border-gold hover:bg-gold/10"
                }`}
              >
                {e.feito && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </span>
              <span className={e.feito ? "text-muted" : "text-text"}>
                {displayProcessName(e.nome)}
              </span>
            </label>
            <span className="shrink-0 text-[13.5px] tabular-nums">
              {e.feito ? (
                editando ? (
                  <input
                    type="date"
                    value={datas[e.id] ?? ""}
                    onChange={(ev) => setDatas((d) => ({ ...d, [e.id]: ev.target.value }))}
                    className="campo h-8 w-40"
                  />
                ) : (
                  <span className="text-subtle">
                    {e.data_feito ? `Feito em ${formatDate(e.data_feito)}` : "Feito"}
                  </span>
                )
              ) : (
                <span className="text-warn">Pendente</span>
              )}
            </span>
          </div>
        ))
      )}
    </section>
  );
}
