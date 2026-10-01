"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { salvarResultadosEmLote, type LinhaLote } from "@/app/actions/resultados";
import { formatBRL, plural } from "@/lib/format";

type Valores = {
  investimento: number;
  leads: number;
  vendas_campanha_interna: number;
  vendas_trafego_pago: number;
  faturamento_campanha_interna: number;
  faturamento_trafego_pago: number;
  observacao: string;
};

export type LinhaInicial = {
  grupoId: string;
  grupoNome: string;
  resultadoId: string | null;
  multiplos: number;
  valores: Valores;
};

const NUMERICOS: { k: Exclude<keyof Valores, "observacao">; rotulo: string; dinheiro: boolean }[] = [
  { k: "investimento", rotulo: "Investimento (R$)", dinheiro: true },
  { k: "leads", rotulo: "Leads", dinheiro: false },
  { k: "vendas_campanha_interna", rotulo: "Vendas camp. interna", dinheiro: false },
  { k: "vendas_trafego_pago", rotulo: "Vendas tráfego", dinheiro: false },
  { k: "faturamento_campanha_interna", rotulo: "Fat. camp. interna (R$)", dinheiro: true },
  { k: "faturamento_trafego_pago", rotulo: "Fat. tráfego (R$)", dinheiro: true },
];

type Texto = Record<keyof Valores, string>;

function paraTexto(v: Valores): Texto {
  const t = { observacao: v.observacao } as Texto;
  for (const c of NUMERICOS) t[c.k] = v[c.k] === 0 ? "" : String(v[c.k]).replace(".", ",");
  return t;
}

// Aceita "1.234,50", "1234,5", "1234.50" (ponto como decimal quando tem 1 ou
// 2 casas) e "1.234" (ponto como milhar).
function paraNumero(s: string): number {
  const t = s.trim();
  if (t === "") return 0;
  if (t.includes(",")) return Number(t.replace(/\./g, "").replace(",", "."));
  if (/^\d+\.\d{1,2}$/.test(t)) return Number(t);
  return Number(t.replace(/\./g, ""));
}

export function LancamentoEmLote({
  mes,
  linhasIniciais,
  outrosAtivos,
}: {
  mes: string;
  linhasIniciais: LinhaInicial[];
  outrosAtivos: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [linhas, setLinhas] = useState(linhasIniciais);
  const [textos, setTextos] = useState<Record<string, Texto>>(() =>
    Object.fromEntries(linhasIniciais.map((l) => [l.grupoId, paraTexto(l.valores)]))
  );
  const [isPending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const disponiveis = outrosAtivos.filter((g) => !linhas.some((l) => l.grupoId === g.id));

  // Linha alterada = algum valor diferente do que veio do banco.
  const alteradas = useMemo(() => {
    return linhas.filter((l) => {
      if (l.multiplos) return false;
      const t = textos[l.grupoId];
      if (!t) return false;
      if (t.observacao.trim() !== l.valores.observacao.trim()) return true;
      return NUMERICOS.some((c) => paraNumero(t[c.k]) !== l.valores[c.k]);
    });
  }, [linhas, textos]);

  function set(grupoId: string, k: keyof Valores, v: string) {
    setMensagem(null);
    setTextos((atual) => ({
      ...atual,
      [grupoId]: { ...atual[grupoId], [k]: k === "observacao" ? v : v.replace(/[^0-9.,]/g, "") },
    }));
  }

  function adicionar(grupoId: string) {
    const g = outrosAtivos.find((x) => x.id === grupoId);
    if (!g) return;
    const vazio: Valores = {
      investimento: 0,
      leads: 0,
      vendas_campanha_interna: 0,
      vendas_trafego_pago: 0,
      faturamento_campanha_interna: 0,
      faturamento_trafego_pago: 0,
      observacao: "",
    };
    setLinhas((ls) => [...ls, { grupoId: g.id, grupoNome: g.nome, resultadoId: null, multiplos: 0, valores: vazio }]);
    setTextos((t) => ({ ...t, [g.id]: paraTexto(vazio) }));
  }

  function salvar() {
    const payload: LinhaLote[] = alteradas.map((l) => {
      const t = textos[l.grupoId];
      return {
        grupoId: l.grupoId,
        resultadoId: l.resultadoId,
        investimento: paraNumero(t.investimento),
        leads: paraNumero(t.leads),
        vendas_campanha_interna: paraNumero(t.vendas_campanha_interna),
        vendas_trafego_pago: paraNumero(t.vendas_trafego_pago),
        faturamento_campanha_interna: paraNumero(t.faturamento_campanha_interna),
        faturamento_trafego_pago: paraNumero(t.faturamento_trafego_pago),
        observacao: t.observacao,
      };
    });
    if (payload.some((p) => Object.values(p).some((v) => typeof v === "number" && Number.isNaN(v)))) {
      setMensagem({ tipo: "erro", texto: "Confira os valores: só números." });
      return;
    }
    startTransition(async () => {
      const r = await salvarResultadosEmLote(mes, payload);
      if (!r.ok) {
        setMensagem({ tipo: "erro", texto: r.error });
        return;
      }
      setMensagem({ tipo: "ok", texto: `${plural(r.salvos, "linha salva", "linhas salvas")}.` });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-left text-[14px]">
          <thead>
            <tr className="border-b border-line text-[13px] text-muted">
              <th className="px-2 pb-2.5 font-normal">Grupo</th>
              {NUMERICOS.map((c) => (
                <th key={c.k} className="px-2 pb-2.5 font-normal">
                  {c.rotulo}
                </th>
              ))}
              <th className="px-2 pb-2.5 font-normal">Observação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const t = textos[l.grupoId];
              const alterada = alteradas.includes(l);
              return (
                <tr key={l.grupoId} className="border-b border-line-soft align-top last:border-0">
                  <td className="w-40 px-2 py-2.5">
                    <span className="flex items-center gap-2 text-text">
                      {alterada && <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-gold" title="Alterada" />}
                      {l.grupoNome}
                    </span>
                    <span className="text-[12px] text-muted">
                      {l.multiplos ? "" : l.resultadoId ? "já lançado" : "sem lançamento"}
                    </span>
                  </td>
                  {l.multiplos ? (
                    <td colSpan={NUMERICOS.length + 1} className="px-2 py-3 text-[13.5px] text-muted">
                      {l.multiplos} lançamentos neste mês — edite na{" "}
                      <Link href={`/grupos/${l.grupoId}/resultados`} prefetch={false} className="link">
                        aba Resultados do grupo
                      </Link>
                      .
                    </td>
                  ) : (
                    <>
                      {NUMERICOS.map((c) => (
                        <td key={c.k} className="px-1.5 py-2">
                          <input
                            inputMode="decimal"
                            value={t[c.k]}
                            placeholder="0"
                            aria-label={`${c.rotulo} — ${l.grupoNome}`}
                            onChange={(e) => set(l.grupoId, c.k, e.target.value)}
                            className="campo h-9 px-2 text-right tabular-nums"
                          />
                        </td>
                      ))}
                      <td className="px-1.5 py-2">
                        <input
                          value={t.observacao}
                          aria-label={`Observação — ${l.grupoNome}`}
                          onChange={(e) => set(l.grupoId, "observacao", e.target.value)}
                          className="campo h-9 px-2"
                        />
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={NUMERICOS.length + 2} className="px-2 py-8 text-center text-muted">
                  Nenhum grupo ativo com tráfego pago. Inclua um grupo abaixo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        {disponiveis.length > 0 ? (
          <select
            value=""
            onChange={(e) => adicionar(e.target.value)}
            aria-label="Incluir outro grupo"
            className="campo h-9 w-auto pr-8 text-[13.5px]"
          >
            <option value="">Incluir outro grupo ativo…</option>
            {disponiveis.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-4">
          {mensagem && (
            <span className={`text-[13.5px] ${mensagem.tipo === "ok" ? "text-ok" : "text-danger"}`}>
              {mensagem.texto}
            </span>
          )}
          <span className="text-[13px] text-muted">
            {alteradas.length === 0
              ? "Nenhuma alteração"
              : plural(alteradas.length, "linha alterada", "linhas alteradas")}
          </span>
          <button
            type="button"
            onClick={salvar}
            disabled={isPending || alteradas.length === 0}
            className="btn-primary"
          >
            {isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
      <p className="text-[13px] text-muted">
        Dica: valores em reais aceitam vírgula (ex.: {formatBRL(1234.5).replace("R$", "").trim()}).
      </p>
    </div>
  );
}
