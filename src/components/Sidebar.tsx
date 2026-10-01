"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Icon, type NomeIcone } from "@/components/ui/Icon";
import { AvisosPainel } from "@/components/AvisosPainel";
import { totalAvisos as contarAvisos, type Avisos } from "@/lib/avisos";

const NAV_ITEMS: { href: string; label: string; icone: NomeIcone }[] = [
  { href: "/grupos", label: "Grupos de gestão", icone: "grupos" },
  { href: "/reunioes", label: "Reuniões", icone: "reunioes" },
  { href: "/agenda", label: "Agenda", icone: "agenda" },
  { href: "/financas", label: "Finanças", icone: "financas" },
  { href: "/resultados", label: "Resultados", icone: "resultados" },
  { href: "/tipos-entrega", label: "Processos", icone: "processos" },
  { href: "/custo-hora", label: "Custo por grupo", icone: "custo" },
];

// Estado "recolhida" salvo no localStorage, lido via useSyncExternalStore
// (sem setState em efeito e sem piscar errado na hidratação).
const CHAVE_RECOLHIDA = "sidebar-recolhida";
const EVENTO_RECOLHIDA = "sidebar-recolhida-mudou";

function lerRecolhida(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_RECOLHIDA) === "1";
  } catch {
    return false;
  }
}

function assinarRecolhida(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO_RECOLHIDA, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO_RECOLHIDA, callback);
  };
}

function salvarRecolhida(valor: boolean) {
  try {
    window.localStorage.setItem(CHAVE_RECOLHIDA, valor ? "1" : "0");
  } catch {
    // sem storage (aba anônima): só não lembra a escolha
  }
  window.dispatchEvent(new Event(EVENTO_RECOLHIDA));
}

export function Sidebar({ avisos, email }: { avisos: Avisos; email: string | null }) {
  const pathname = usePathname();
  const recolhida = useSyncExternalStore(assinarRecolhida, lerRecolhida, () => false);
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [avisosAbertos, setAvisosAbertos] = useState(false);
  const [contaAberta, setContaAberta] = useState(false);
  const totalAvisos = contarAvisos(avisos);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        salvarRecolhida(!lerRecolhida());
      }
      if (e.key === "Escape") {
        setAvisosAbertos(false);
        setContaAberta(false);
        setGavetaAberta(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function fecharTudo() {
    setGavetaAberta(false);
    setAvisosAbertos(false);
    setContaAberta(false);
  }

  // `r`: recolhida só vale no desktop; na gaveta (telas estreitas) a barra
  // aparece sempre completa. Por isso as variações usam min-[900px]:.
  const r = recolhida;
  const soExpandida = r ? "min-[900px]:hidden" : "";
  const soRecolhida = r ? "hidden min-[900px]:block" : "hidden";

  return (
    <>
      {/* Telas estreitas: barra de topo com botão de menu. */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-sidebar px-4 py-3 min-[900px]:hidden">
        <button
          type="button"
          onClick={() => setGavetaAberta(true)}
          aria-label="Abrir menu"
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-muted hover:bg-hover hover:text-text"
        >
          <Icon nome="menu" />
        </button>
        <span className="font-serif text-[17px] font-semibold tracking-[-0.01em] text-text">
          Gestão de Tráfego
        </span>
        <span className="w-9" />
      </div>

      {gavetaAberta && (
        <div
          onClick={() => setGavetaAberta(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 min-[900px]:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] shrink-0 flex-col bg-sidebar px-3 py-3.5 transition-transform duration-200 min-[900px]:sticky min-[900px]:top-0 min-[900px]:z-30 min-[900px]:h-screen min-[900px]:translate-x-0 ${
          gavetaAberta ? "translate-x-0" : "-translate-x-full"
        } ${r ? "min-[900px]:w-[72px] min-[900px]:items-center min-[900px]:gap-1 min-[900px]:px-0" : ""}`}
      >
        {/* Topo: título + recolher (ou só expandir, quando recolhida) */}
        <div
          className={`flex items-center justify-between pb-3.5 pl-2 pr-1 pt-1.5 ${
            r ? "min-[900px]:p-0" : ""
          }`}
        >
          <span
            className={`font-serif text-[19px] font-semibold tracking-[-0.01em] text-text ${soExpandida}`}
          >
            Gestão de Tráfego
          </span>
          <button
            type="button"
            onClick={() => salvarRecolhida(!r)}
            aria-label={r ? "Expandir barra lateral" : "Recolher barra lateral"}
            title={`${r ? "Expandir" : "Recolher"} barra lateral (Ctrl+B)`}
            className={`hidden items-center justify-center text-muted hover:bg-hover hover:text-text min-[900px]:flex ${
              r ? "h-10 w-10 rounded-[10px]" : "h-8 w-8 rounded-lg"
            }`}
          >
            <Icon nome="painel" />
          </button>
          <button
            type="button"
            onClick={() => setGavetaAberta(false)}
            aria-label="Fechar menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-hover hover:text-text min-[900px]:hidden"
          >
            <Icon nome="fechar" />
          </button>
        </div>

        {/* Novo grupo */}
        <ItemComDica rotulo="Novo grupo" recolhida={r}>
          <Link
            href="/grupos/novo"
            prefetch={false}
            onClick={fecharTudo}
            aria-label="Novo grupo"
            className={`flex h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-[14.5px] font-medium text-text hover:bg-hover ${
              r ? "min-[900px]:mb-2 min-[900px]:mt-1.5 min-[900px]:w-10 min-[900px]:justify-center min-[900px]:px-0" : ""
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-on-gold">
              <Icon nome="mais" tamanho={14} traco={2.2} />
            </span>
            <span className={soExpandida}>Novo grupo</span>
          </Link>
        </ItemComDica>

        {/* Menu. prefetch=false: todas as rotas são dinâmicas (Supabase por
            request); com prefetch ligado, o Next dispara uma rajada de
            requisições RSC simultâneas que o Vercel limitava com 503. */}
        <nav
          className={`mt-2 flex flex-col gap-0.5 ${r ? "min-[900px]:mt-0 min-[900px]:gap-1" : ""}`}
        >
          {NAV_ITEMS.map((item) => {
            const ativo = pathname.startsWith(item.href);
            return (
              <ItemComDica key={item.href} rotulo={item.label} recolhida={r}>
                <Link
                  href={item.href}
                  prefetch={false}
                  onClick={fecharTudo}
                  aria-label={item.label}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex h-[38px] items-center gap-3 rounded-[10px] px-2.5 text-[14.5px] transition-colors ${
                    ativo ? "bg-hover text-text" : "text-text-2 hover:bg-hover hover:text-text"
                  } ${r ? "min-[900px]:h-10 min-[900px]:w-10 min-[900px]:justify-center min-[900px]:px-0" : ""}`}
                >
                  <Icon nome={item.icone} />
                  <span className={soExpandida}>{item.label}</span>
                </Link>
              </ItemComDica>
            );
          })}

          {/* Avisos (antigo sino) */}
          <div className="relative">
            <ItemComDica rotulo="Avisos" recolhida={r} desativarDica={avisosAbertos}>
              <button
                type="button"
                onClick={() => setAvisosAbertos(!avisosAbertos)}
                aria-expanded={avisosAbertos}
                aria-label={totalAvisos > 0 ? `Avisos (${totalAvisos})` : "Avisos"}
                className={`relative flex h-[38px] w-full items-center gap-3 rounded-[10px] px-2.5 text-left text-[14.5px] transition-colors ${
                  avisosAbertos ? "bg-hover text-text" : "text-text-2 hover:bg-hover hover:text-text"
                } ${r ? "min-[900px]:h-10 min-[900px]:w-10 min-[900px]:justify-center min-[900px]:px-0" : ""}`}
              >
                <Icon nome="avisos" />
                <span className={`flex-1 ${soExpandida}`}>Avisos</span>
                {totalAvisos > 0 && (
                  <>
                    <span className={`text-xs font-semibold text-gold ${soExpandida}`}>
                      {totalAvisos}
                    </span>
                    <span
                      className={`absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full bg-gold ${soRecolhida}`}
                    />
                  </>
                )}
              </button>
            </ItemComDica>

            {avisosAbertos && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAvisosAbertos(false)} />
                <div
                  role="dialog"
                  aria-label="Avisos"
                  className={`absolute left-0 top-full z-50 mt-1 max-h-[75vh] w-[min(440px,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-line bg-surface p-2 shadow-2xl min-[900px]:fixed min-[900px]:top-4 min-[900px]:mt-0 min-[900px]:max-h-[calc(100vh-2rem)] ${r ? "min-[900px]:left-[84px]" : "min-[900px]:left-[284px]"}`}
                >
                  <AvisosPainel avisos={avisos} onNavegar={fecharTudo} />
                </div>
              </>
            )}
          </div>

          {/* Busca rápida (Ctrl/Cmd + K) */}
          <ItemComDica rotulo="Buscar (Ctrl+K)" recolhida={r}>
            <button
              type="button"
              onClick={() => {
                fecharTudo();
                window.dispatchEvent(new Event("abrir-busca-rapida"));
              }}
              aria-label="Buscar"
              className={`flex h-[38px] w-full items-center gap-3 rounded-[10px] px-2.5 text-left text-[14.5px] text-text-2 transition-colors hover:bg-hover hover:text-text ${
                r ? "min-[900px]:h-10 min-[900px]:w-10 min-[900px]:justify-center min-[900px]:px-0" : ""
              }`}
            >
              <Icon nome="busca" />
              <span className={`flex-1 ${soExpandida}`}>Buscar</span>
              <kbd className={`rounded border border-line px-1.5 text-[11px] text-muted ${soExpandida}`}>
                Ctrl K
              </kbd>
            </button>
          </ItemComDica>
        </nav>

        <div className="flex-1" />

        {/* Conta: menu com Sair */}
        <div className={`relative ${r ? "min-[900px]:w-10" : ""}`}>
          {contaAberta && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setContaAberta(false)} />
              <div
                role="menu"
                className={`absolute bottom-full left-0 z-50 mb-2 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-2xl ${
                  r ? "min-[900px]:bottom-0 min-[900px]:left-full min-[900px]:mb-0 min-[900px]:ml-2" : ""
                }`}
              >
                {email && <p className="truncate px-3 py-2 text-[13px] text-muted">{email}</p>}
                <form action={logout}>
                  <button
                    type="submit"
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-text-2 hover:bg-hover hover:text-text"
                  >
                    <Icon nome="sair" tamanho={16} />
                    Sair
                  </button>
                </form>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => setContaAberta(!contaAberta)}
            aria-haspopup="menu"
            aria-expanded={contaAberta}
            aria-label="Conta: Rafael"
            className={`flex h-12 w-full items-center gap-2.5 border-t border-hover px-2 text-left hover:bg-hover ${
              r ? "min-[900px]:h-10 min-[900px]:justify-center min-[900px]:rounded-[10px] min-[900px]:border-t-0 min-[900px]:px-0" : ""
            }`}
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-raised text-[13px] font-semibold text-text">
              R
            </span>
            <span className={`flex min-w-0 flex-1 flex-col ${soExpandida}`}>
              <span className="text-sm text-text">Rafael</span>
              <span className="text-[13px] text-muted">Conta compartilhada</span>
            </span>
            <span className={`text-subtle ${soExpandida}`}>
              <Icon nome="seletor" tamanho={16} traco={1.8} />
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

// Na barra recolhida (desktop), mostra o nome do item num balão ao lado.
function ItemComDica({
  rotulo,
  recolhida,
  desativarDica = false,
  children,
}: {
  rotulo: string;
  recolhida: boolean;
  desativarDica?: boolean;
  children: React.ReactNode;
}) {
  if (!recolhida) return <>{children}</>;
  return (
    <div className="group/dica relative">
      {children}
      {!desativarDica && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] text-text opacity-0 shadow-xl transition-opacity group-hover/dica:opacity-100 group-focus-within/dica:opacity-100 min-[900px]:block"
        >
          {rotulo}
        </span>
      )}
    </div>
  );
}
