"use client";

import { useState } from "react";
import { formatBRL, formatDate } from "@/lib/format";
import { linkWhatsappPara, mensagemCobranca, normalizarTelefone } from "@/lib/whatsapp";
import type { MentoradoContato } from "@/lib/avisos";

// "Cobrar no WhatsApp": abre o WhatsApp com a mensagem pronta pro telefone
// de um mentorado do grupo (escolhe quando há mais de um). Nada é enviado
// sozinho.
export function CobrarWhatsApp({
  mentorados,
  valor,
  vencimento,
}: {
  mentorados: MentoradoContato[];
  valor: number;
  vencimento: string;
}) {
  const [aberto, setAberto] = useState(false);

  const contatos = mentorados.map((m) => ({ ...m, numero: normalizarTelefone(m.telefone) }));
  const validos = contatos.filter((c) => c.numero);

  function link(c: (typeof contatos)[number]) {
    return linkWhatsappPara(
      c.numero!,
      mensagemCobranca(c.nome, formatBRL(valor), formatDate(vencimento).slice(0, 5))
    );
  }

  if (validos.length === 0) {
    return (
      <span
        className="text-[13px] text-muted"
        title={
          mentorados.length === 0
            ? "Nenhum mentorado cadastrado neste grupo."
            : "Nenhum mentorado com telefone válido. Corrija o telefone na Visão geral do grupo."
        }
      >
        Sem telefone válido
      </span>
    );
  }

  if (contatos.length === 1) {
    return (
      <a href={link(validos[0])} target="_blank" rel="noopener noreferrer" className="link text-[13.5px]">
        Cobrar no WhatsApp ↗
      </a>
    );
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAberto(!aberto);
        }}
        aria-haspopup="menu"
        aria-expanded={aberto}
        className="link text-[13.5px]"
      >
        Cobrar no WhatsApp ▾
      </button>
      {aberto && (
        <>
          <span className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <span
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 flex min-w-56 flex-col rounded-xl border border-line bg-surface p-1.5 shadow-2xl"
          >
            <span className="px-3 pb-1 pt-1.5 text-[13px] text-muted">Enviar para</span>
            {contatos.map((c) =>
              c.numero ? (
                <a
                  key={c.nome}
                  role="menuitem"
                  href={link(c)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setAberto(false)}
                  className="rounded-lg px-3 py-2 text-left text-sm text-text-2 hover:bg-hover hover:text-text"
                >
                  {c.nome}
                </a>
              ) : (
                <span key={c.nome} className="px-3 py-2 text-sm text-muted" title="Telefone ausente ou inválido">
                  {c.nome} · sem telefone válido
                </span>
              )
            )}
          </span>
        </>
      )}
    </span>
  );
}
