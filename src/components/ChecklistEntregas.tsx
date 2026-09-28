"use client";

import { useState, useTransition } from "react";
import { toggleEntrega, updateEntregaData } from "@/app/actions/entregas";
import { formatDate } from "@/lib/format";

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
            <label className="flex cursor-pointer items-center gap-3 text-text">
              <input
                type="checkbox"
                checked={e.feito}
                disabled={isPending || editando}
                onChange={(ev) =>
                  startTransition(() => toggleEntrega(grupoId, e.id, ev.target.checked))
                }
                className="h-4 w-4 shrink-0"
              />
              <span className={e.feito ? "text-text-2" : ""}>{e.nome}</span>
            </label>
            <span className="shrink-0 text-[13.5px] tabular-nums text-muted">
              {e.feito ? (
                editando ? (
                  <input
                    type="date"
                    value={datas[e.id] ?? ""}
                    onChange={(ev) => setDatas((d) => ({ ...d, [e.id]: ev.target.value }))}
                    className="campo h-8 w-40"
                  />
                ) : e.data_feito ? (
                  `Feito em ${formatDate(e.data_feito)}`
                ) : (
                  "Feito"
                )
              ) : (
                "—"
              )}
            </span>
          </div>
        ))
      )}
    </section>
  );
}
