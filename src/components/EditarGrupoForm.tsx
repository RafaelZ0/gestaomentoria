"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { atualizarGrupo } from "@/app/actions/grupos";
import type { TrafegoPago } from "@/lib/database.types";

type Dados = {
  nome: string;
  valor_mensal: string;
  data_inicio: string;
  data_fim_contrato: string;
  observacoes: string;
  trafego_pago: TrafegoPago | "";
  trafego_pago_desde: string;
  valor_investido_dia: string;
  meta_roas: string;
  meta_cpl: string;
};

const OPCOES_TRAFEGO: { valor: TrafegoPago | ""; label: string }[] = [
  { valor: "", label: "—" },
  { valor: "SIM", label: "Sim" },
  { valor: "NÃO", label: "Não" },
  { valor: "PARADO", label: "Parado" },
  { valor: "EM IMPLEMENTAÇÃO", label: "Em implementação" },
];

// Modo "Editar" da Visão geral: todos os campos editáveis do grupo num lugar
// só, com Salvar e Cancelar. O nome aparece com o valor original do banco.
export function EditarGrupoForm({ grupoId, inicial }: { grupoId: string; inicial: Dados }) {
  const router = useRouter();
  const [dados, setDados] = useState<Dados>(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof Dados>(campo: K, valor: Dados[K]) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  function numero(v: string) {
    return v.replace(/[^0-9.,]/g, "");
  }

  function salvar() {
    setErro(null);
    startTransition(async () => {
      const r = await atualizarGrupo(grupoId, dados);
      if (!r.ok) {
        setErro(r.error);
        return;
      }
      router.push(`/grupos/${grupoId}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        salvar();
      }}
      className="flex flex-col gap-8"
    >
      <div className="flex items-center justify-between gap-4 rounded-xl bg-surface px-5 py-3.5">
        <span className="text-[14.5px] text-text">Editando o cadastro do grupo</span>
        <div className="flex gap-2">
          <Link href={`/grupos/${grupoId}`} prefetch={false} className="btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>

      {erro && <p className="text-sm text-danger">{erro}</p>}

      <section className="flex flex-col gap-4">
        <h2 className="text-[15px] font-semibold text-text">Contrato e pagamentos</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome do grupo">
            <input
              value={dados.nome}
              onChange={(e) => set("nome", e.target.value)}
              className="campo"
              required
            />
          </Campo>
          <Campo rotulo="Valor mensal (R$)">
            <input
              inputMode="decimal"
              value={dados.valor_mensal}
              onChange={(e) => set("valor_mensal", numero(e.target.value))}
              className="campo tabular-nums"
            />
          </Campo>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h2 className="text-[15px] font-semibold text-text">Tráfego pago</h2>
          <Campo rotulo="Status">
            <select
              value={dados.trafego_pago}
              onChange={(e) => set("trafego_pago", e.target.value as TrafegoPago | "")}
              className="campo"
            >
              {OPCOES_TRAFEGO.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.label}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Ativo desde">
            <input
              type="date"
              value={dados.trafego_pago_desde}
              onChange={(e) => set("trafego_pago_desde", e.target.value)}
              className="campo"
            />
          </Campo>
          <Campo rotulo="Investimento por dia (R$)">
            <input
              inputMode="decimal"
              value={dados.valor_investido_dia}
              onChange={(e) => set("valor_investido_dia", numero(e.target.value))}
              className="campo tabular-nums"
            />
          </Campo>
          <div className="grid grid-cols-2 gap-4">
            <Campo rotulo="Meta de ROAS (x)">
              <input
                inputMode="decimal"
                value={dados.meta_roas}
                placeholder="—"
                onChange={(e) => set("meta_roas", numero(e.target.value))}
                className="campo tabular-nums"
              />
            </Campo>
            <Campo rotulo="Meta de CPL (R$)">
              <input
                inputMode="decimal"
                value={dados.meta_cpl}
                placeholder="—"
                onChange={(e) => set("meta_cpl", numero(e.target.value))}
                className="campo tabular-nums"
              />
            </Campo>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-[15px] font-semibold text-text">Cadastro</h2>
          <Campo rotulo="Início do contrato">
            <input
              type="date"
              value={dados.data_inicio}
              onChange={(e) => set("data_inicio", e.target.value)}
              className="campo"
              required
            />
          </Campo>
          <Campo rotulo="Fim do contrato (para avisar da renovação)">
            <input
              type="date"
              value={dados.data_fim_contrato}
              min={dados.data_inicio || undefined}
              onChange={(e) => set("data_fim_contrato", e.target.value)}
              className="campo"
            />
          </Campo>
          <Campo rotulo="Observações">
            <textarea
              rows={4}
              value={dados.observacoes}
              placeholder="Sem observações"
              onChange={(e) => set("observacoes", e.target.value)}
              className="campo resize-y"
            />
          </Campo>
        </section>
      </div>
    </form>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="rotulo">{rotulo}</span>
      {children}
    </label>
  );
}
