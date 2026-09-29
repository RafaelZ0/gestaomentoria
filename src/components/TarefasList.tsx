"use client";

import { useState, useTransition } from "react";
import { createTarefa, toggleTarefa, updateTarefa, removeTarefa } from "@/app/actions/tarefas";
import { ResponsavelField } from "@/components/ResponsavelField";
import { StatusDot, type Tom } from "@/components/ui/StatusDot";
import { RowMenu } from "@/components/ui/RowMenu";
import { formatDate } from "@/lib/format";
import type { Tarefa, Responsavel, PrioridadeTarefa } from "@/lib/database.types";

const PRIORIDADE_TOM: Record<PrioridadeTarefa, Tom> = {
  Alta: "danger",
  Média: "warn",
  Baixa: "off",
};

export function TarefasList({
  grupoId,
  tarefas,
  responsaveis,
}: {
  grupoId: string;
  tarefas: Tarefa[];
  responsaveis: Responsavel[];
}) {
  const [isPending, startTransition] = useTransition();

  const pendentes = tarefas.filter((t) => !t.concluida);
  const concluidas = tarefas.filter((t) => t.concluida);

  const responsavelPorId = new Map(responsaveis.map((r) => [r.id, r.nome]));

  return (
    <div className="flex flex-col gap-8">
      <form
        action={(formData) =>
          startTransition(async () => {
            await createTarefa(grupoId, formData);
          })
        }
        className="flex flex-col gap-3 border-b border-line pb-7"
      >
        <input
          name="descricao"
          required
          placeholder="Nova tarefa…"
          aria-label="Nova tarefa"
          className="campo"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="rotulo mb-1.5">Prazo</label>
            <input type="date" name="prazo" className="campo" />
          </div>
          <div>
            <label className="rotulo mb-1.5">Prioridade</label>
            <select name="prioridade" defaultValue="Média" className="campo">
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          <ResponsavelField responsaveis={responsaveis} label="Responsável" />
        </div>
        <button type="submit" disabled={isPending} className="btn-secondary w-fit">
          Adicionar
        </button>
      </form>

      <section className="flex flex-col">
        <h2 className="border-b border-line pb-2 text-[15px] font-semibold text-text">Pendentes</h2>
        <ul className="flex flex-col">
          {pendentes.map((t) => (
            <TarefaItem
              key={t.id}
              grupoId={grupoId}
              tarefa={t}
              responsaveis={responsaveis}
              responsavelNome={t.responsavel_id ? responsavelPorId.get(t.responsavel_id) : undefined}
            />
          ))}
          {tarefas.length === 0 && (
            <p className="py-4 text-sm text-muted">Nenhuma tarefa cadastrada.</p>
          )}
          {tarefas.length > 0 && pendentes.length === 0 && (
            <p className="py-4 text-sm text-muted">Nenhuma tarefa pendente.</p>
          )}
        </ul>
      </section>

      {concluidas.length > 0 && (
        <section className="flex flex-col">
          <h2 className="border-b border-line pb-2 text-[15px] font-semibold text-text">
            Concluídas
          </h2>
          <ul className="flex flex-col">
            {concluidas.map((t) => (
              <TarefaItem
                key={t.id}
                grupoId={grupoId}
                tarefa={t}
                responsaveis={responsaveis}
                responsavelNome={t.responsavel_id ? responsavelPorId.get(t.responsavel_id) : undefined}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TarefaItem({
  grupoId,
  tarefa,
  responsaveis,
  responsavelNome,
}: {
  grupoId: string;
  tarefa: Tarefa;
  responsaveis: Responsavel[];
  responsavelNome: string | undefined;
}) {
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hoje = new Date().toISOString().slice(0, 10);
  const atrasada = !tarefa.concluida && !!tarefa.prazo && tarefa.prazo < hoje;

  if (editando) {
    return (
      <li className="border-b border-line-soft py-4 last:border-b-0">
        {error && <p className="mb-2 text-xs text-danger">{error}</p>}
        <form
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              try {
                await updateTarefa(grupoId, tarefa.id, formData);
                setEditando(false);
              } catch (e) {
                if (e instanceof Error) setError(e.message);
              }
            });
          }}
          className="flex flex-col gap-3"
        >
          <input name="descricao" required defaultValue={tarefa.descricao} className="campo" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="rotulo mb-1.5">Prazo</label>
              <input type="date" name="prazo" defaultValue={tarefa.prazo ?? ""} className="campo" />
            </div>
            <div>
              <label className="rotulo mb-1.5">Prioridade</label>
              <select name="prioridade" defaultValue={tarefa.prioridade} className="campo">
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            <ResponsavelField
              responsaveis={responsaveis}
              defaultResponsavelId={tarefa.responsavel_id ?? ""}
              label="Responsável"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditando(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="btn-secondary">
              Salvar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start gap-3 border-b border-line-soft py-3.5 last:border-b-0">
      <input
        type="checkbox"
        checked={tarefa.concluida}
        disabled={isPending}
        aria-label={tarefa.concluida ? "Marcar como pendente" : "Marcar como concluída"}
        onChange={(e) => startTransition(() => toggleTarefa(grupoId, tarefa.id, e.target.checked))}
        className="mt-1 h-4 w-4 shrink-0"
      />
      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setEditando(true)}>
        <span
          className={`text-[14.5px] ${tarefa.concluida ? "text-muted line-through" : "text-text"}`}
        >
          {tarefa.descricao}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
          <StatusDot tom={tarefa.concluida ? "off" : PRIORIDADE_TOM[tarefa.prioridade]}>
            {tarefa.prioridade}
          </StatusDot>
          {tarefa.prazo && (
            <span className={`tabular-nums ${atrasada ? "text-danger" : "text-muted"}`}>
              {atrasada ? "Atrasada — " : "Prazo: "}
              {formatDate(tarefa.prazo)}
            </span>
          )}
          {responsavelNome && <span className="text-muted">{responsavelNome}</span>}
        </div>
      </div>
      <RowMenu
        rotulo={`Mais opções de ${tarefa.descricao}`}
        acoes={[
          { label: "Editar", onSelect: () => setEditando(true) },
          {
            label: "Remover",
            destrutiva: true,
            confirmar: { titulo: "Remover esta tarefa?", texto: tarefa.descricao, botao: "Remover" },
            onSelect: () => removeTarefa(grupoId, tarefa.id),
          },
        ]}
      />
    </li>
  );
}
