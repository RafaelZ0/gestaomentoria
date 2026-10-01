"use client";

import Link from "next/link";
import { formatBRL, formatDate, formatMesAno, plural } from "@/lib/format";
import { totalAvisos, type Avisos } from "@/lib/avisos";
import { BotaoAgendar } from "@/components/AgendamentoProvider";
import { CobrarWhatsApp } from "@/components/CobrarWhatsApp";

// Conteúdo da central de Avisos: um bloco por tipo, cada item com a ação
// direta (agendar, cobrar, lançar, fazer diagnóstico...).
export function AvisosPainel({
  avisos,
  onNavegar,
}: {
  avisos: Avisos;
  onNavegar: () => void;
}) {
  if (totalAvisos(avisos) === 0) {
    return <p className="px-3 py-4 text-sm text-muted">Nenhum aviso por enquanto.</p>;
  }

  const linha = "flex items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-sm hover:bg-hover";

  return (
    <div className="flex flex-col gap-3">
      {avisos.reuniaoHoje.length > 0 && (
        <Bloco titulo="Reunião hoje">
          {avisos.reuniaoHoje.map((n) => (
            <Link
              key={n.reuniaoId}
              href={`/grupos/${n.grupoId}/reunioes`}
              prefetch={false}
              onClick={onNavegar}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-hover"
            >
              <span className="font-medium text-text">{n.grupoNome}</span>
              <span className="text-text-2">
                {" "}
                · reunião hoje{n.hora ? ` às ${n.hora.slice(0, 5)}` : ""}, não esqueça de mandar o
                lembrete
              </span>
            </Link>
          ))}
        </Bloco>
      )}

      {avisos.reuniao.length > 0 && (
        <Bloco titulo="Reunião · hora de agendar a próxima">
          {avisos.reuniao.map((n) => (
            <div key={n.grupoId} className={linha}>
              <Link href={`/grupos/${n.grupoId}/reunioes`} prefetch={false} onClick={onNavegar} className="min-w-0">
                <span className="font-medium text-text">{n.grupoNome}</span>
                <span className="ml-2 text-[13px] text-muted">
                  {n.diasSemReuniao === null
                    ? "nunca teve reunião"
                    : `última há ${plural(n.diasSemReuniao, "dia", "dias")}`}
                </span>
              </Link>
              <BotaoAgendar grupoId={n.grupoId} onAbrir={onNavegar} />
            </div>
          ))}
        </Bloco>
      )}

      {avisos.pagamento.length > 0 && (
        <Bloco titulo={`Pagamento · ${plural(avisos.pagamento.length, "boleto atrasado", "boletos atrasados")}`}>
          {avisos.pagamento.map((p) => (
            <div key={p.pagamentoId} className={linha}>
              <Link href={`/grupos/${p.grupoId}/pagamentos`} prefetch={false} onClick={onNavegar} className="min-w-0">
                <span className="font-medium text-text">{p.grupoNome}</span>
                <span className="ml-2 text-[13px] tabular-nums text-danger">
                  {formatBRL(p.valor)} · venceu {formatDate(p.vencimento).slice(0, 5)}
                </span>
              </Link>
              <CobrarWhatsApp mentorados={p.mentorados} valor={p.valor} vencimento={p.vencimento} />
            </div>
          ))}
        </Bloco>
      )}

      {avisos.resultados.length > 0 && (
        <Bloco
          titulo={`Resultados · sem lançamento em ${formatMesAno(
            Number(avisos.resultados[0].mes.slice(0, 4)),
            Number(avisos.resultados[0].mes.slice(5, 7))
          ).toLocaleLowerCase("pt-BR")}`}
        >
          {avisos.resultados.map((r) => (
            <div key={r.grupoId} className={linha}>
              <span className="font-medium text-text">{r.grupoNome}</span>
              <Link
                href={`/resultados/lancar?mes=${r.mes}`}
                prefetch={false}
                onClick={onNavegar}
                className="link text-[13.5px]"
              >
                Lançar
              </Link>
            </div>
          ))}
        </Bloco>
      )}

      {avisos.onboarding.length > 0 && (
        <Bloco titulo="Onboarding · diagnóstico não feito">
          {avisos.onboarding.map((o) => (
            <div key={o.grupoId} className={linha}>
              <span className="font-medium text-text">{o.grupoNome}</span>
              <Link
                href={`/grupos/${o.grupoId}/onboarding`}
                prefetch={false}
                onClick={onNavegar}
                className="link text-[13.5px]"
              >
                Fazer diagnóstico
              </Link>
            </div>
          ))}
        </Bloco>
      )}

      {avisos.processos.length > 0 && (
        <Bloco titulo="Processos · pendentes">
          {avisos.processos.map((p) => (
            <Link
              key={p.grupoId}
              href={`/grupos/${p.grupoId}`}
              prefetch={false}
              onClick={onNavegar}
              className={linha}
            >
              <span className="font-medium text-text">{p.grupoNome}</span>
              <span className="text-[13px] text-muted">
                {plural(p.pendentes, "processo pendente", "processos pendentes")}
              </span>
            </Link>
          ))}
        </Bloco>
      )}
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line-soft pb-2 last:border-b-0 last:pb-0">
      <p className="px-3 pb-1 pt-1 text-[13px] text-muted">{titulo}</p>
      {children}
    </div>
  );
}
