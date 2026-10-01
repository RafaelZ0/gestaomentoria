"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useAgendamento } from "@/components/AgendamentoProvider";

type Item = {
  id: string;
  rotulo: string;
  detalhe?: string;
  grupo: "Ações" | "Grupos" | "Mentorados";
  executar: () => void;
};

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// Paleta de comandos (Ctrl/Cmd + K) disponível em qualquer página: busca
// grupos pelo nome de exibição e pelos mentorados, e executa ações.
export function BuscaRapida({
  grupos,
  mentorados,
}: {
  grupos: { id: string; nome: string; ativo: boolean }[];
  mentorados: { nome: string; grupoId: string }[];
}) {
  const router = useRouter();
  const abrirAgendamento = useAgendamento();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberto((a) => !a);
        setBusca("");
        setSelecionado(0);
      }
    }
    function onAbrir() {
      setAberto(true);
      setBusca("");
      setSelecionado(0);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("abrir-busca-rapida", onAbrir);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("abrir-busca-rapida", onAbrir);
    };
  }, []);

  const nomeGrupo = useMemo(() => new Map(grupos.map((g) => [g.id, g.nome])), [grupos]);

  const itens = useMemo<Item[]>(() => {
    const ir = (href: string) => () => router.push(href);
    const acoes: Item[] = [
      { id: "a-agendar", rotulo: "Agendar reunião", grupo: "Ações", executar: () => abrirAgendamento() },
      { id: "a-novo", rotulo: "Novo grupo", grupo: "Ações", executar: ir("/grupos/novo") },
      { id: "a-lancar", rotulo: "Lançar resultados", grupo: "Ações", executar: ir("/resultados/lancar") },
      { id: "a-inicio", rotulo: "Ir para Início", grupo: "Ações", executar: ir("/inicio") },
      { id: "a-grupos", rotulo: "Ir para Grupos de gestão", grupo: "Ações", executar: ir("/grupos") },
      { id: "a-reunioes", rotulo: "Ir para Reuniões", grupo: "Ações", executar: ir("/reunioes") },
      { id: "a-agenda", rotulo: "Ir para Agenda", grupo: "Ações", executar: ir("/agenda") },
      { id: "a-financas", rotulo: "Ir para Finanças", grupo: "Ações", executar: ir("/financas") },
      { id: "a-resultados", rotulo: "Ir para Resultados", grupo: "Ações", executar: ir("/resultados") },
      { id: "a-processos", rotulo: "Ir para Processos", grupo: "Ações", executar: ir("/tipos-entrega") },
      { id: "a-custo", rotulo: "Ir para Custo por grupo", grupo: "Ações", executar: ir("/custo-hora") },
    ];
    const deGrupos: Item[] = grupos.map((g) => ({
      id: `g-${g.id}`,
      rotulo: g.nome,
      detalhe: g.ativo ? undefined : "Inativo",
      grupo: "Grupos",
      executar: ir(`/grupos/${g.id}`),
    }));
    const deMentorados: Item[] = mentorados.map((m, i) => ({
      id: `m-${i}`,
      rotulo: m.nome,
      detalhe: nomeGrupo.get(m.grupoId),
      grupo: "Mentorados",
      executar: ir(`/grupos/${m.grupoId}`),
    }));

    const q = normalizar(busca.trim());
    if (!q) return [...acoes.slice(0, 3), ...deGrupos.filter((_, i) => grupos[i].ativo)];
    const casa = (it: Item) => normalizar(`${it.rotulo} ${it.detalhe ?? ""}`).includes(q);
    return [...acoes.filter(casa), ...deGrupos.filter(casa), ...deMentorados.filter(casa)].slice(0, 30);
  }, [busca, grupos, mentorados, nomeGrupo, router, abrirAgendamento]);

  useEffect(() => {
    if (aberto) inputRef.current?.focus();
  }, [aberto]);

  useEffect(() => {
    listaRef.current
      ?.querySelector(`[data-indice="${selecionado}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selecionado]);

  if (!aberto) return null;

  function executar(it: Item | undefined) {
    if (!it) return;
    setAberto(false);
    it.executar();
  }

  let ultimoGrupo: string | null = null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-[12vh]"
      onClick={() => setAberto(false)}
    >
      <div
        role="dialog"
        aria-label="Busca rápida"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
      >
        <label className="flex items-center gap-3 border-b border-line px-4">
          <span className="text-muted">
            <Icon nome="busca" tamanho={17} traco={1.8} />
          </span>
          <input
            ref={inputRef}
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setSelecionado(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelecionado((s) => Math.min(itens.length - 1, s + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelecionado((s) => Math.max(0, s - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                executar(itens[selecionado]);
              } else if (e.key === "Escape") {
                setAberto(false);
              }
            }}
            placeholder="Buscar grupo, mentorado ou ação…"
            aria-label="Buscar"
            className="h-12 w-full border-0 bg-transparent text-[15px] text-text shadow-none outline-none placeholder:text-subtle focus:shadow-none"
          />
          <kbd className="rounded border border-line px-1.5 text-[11px] text-muted">Esc</kbd>
        </label>
        <div ref={listaRef} role="listbox" className="max-h-[50vh] overflow-y-auto p-1.5">
          {itens.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted">Nada encontrado.</p>}
          {itens.map((it, i) => {
            const cabecalho = it.grupo !== ultimoGrupo ? it.grupo : null;
            ultimoGrupo = it.grupo;
            return (
              <div key={it.id}>
                {cabecalho && <p className="px-3 pb-1 pt-2.5 text-[12px] text-muted">{cabecalho}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === selecionado}
                  data-indice={i}
                  onMouseEnter={() => setSelecionado(i)}
                  onClick={() => executar(it)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                    i === selecionado ? "bg-hover text-text" : "text-text-2"
                  }`}
                >
                  <span className="truncate">{it.rotulo}</span>
                  {it.detalhe && <span className="shrink-0 text-[13px] text-muted">{it.detalhe}</span>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
