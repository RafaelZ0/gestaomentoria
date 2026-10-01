import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { displayGroupName, formatMesAno } from "@/lib/format";
import { mesAnteriorISO } from "@/lib/avisos";
import { PageHeader } from "@/components/ui/PageHeader";
import { LancamentoEmLote, type LinhaInicial } from "@/components/LancamentoEmLote";

function proximoMesISO(mes: string): string {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(ano, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function LancarResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const hoje = new Date().toISOString().slice(0, 10);
  // Padrão: mês anterior (o que normalmente se lança no início do mês).
  const mes = mesParam && /^\d{4}-\d{2}$/.test(mesParam) ? mesParam : mesAnteriorISO(hoje);
  const proximo = proximoMesISO(mes);
  const anterior = mesAnteriorISO(`${mes}-01`);

  const supabase = await createClient();
  const [{ data: grupos }, { data: resultados }] = await Promise.all([
    supabase.from("grupos_gestao").select("id, nome, status, trafego_pago"),
    supabase
      .from("resultados_grupo")
      .select("*")
      .gte("data", `${mes}-01`)
      .lt("data", `${proximo}-01`)
      .order("created_at", { ascending: true }),
  ]);

  const porGrupo = new Map<string, NonNullable<typeof resultados>>();
  for (const r of resultados ?? []) {
    const lista = porGrupo.get(r.grupo_id) ?? [];
    lista.push(r);
    porGrupo.set(r.grupo_id, lista);
  }

  // Linhas: grupos ativos com tráfego "Sim" + qualquer grupo que já tenha
  // lançamento no mês. Os outros ativos podem ser incluídos na tela.
  const linhas: LinhaInicial[] = (grupos ?? [])
    .filter((g) => (g.status === "Ativo" && g.trafego_pago === "SIM") || porGrupo.has(g.id))
    .map((g) => {
      const doMes = porGrupo.get(g.id) ?? [];
      const r = doMes.length === 1 ? doMes[0] : null;
      return {
        grupoId: g.id,
        grupoNome: displayGroupName(g.nome),
        resultadoId: r?.id ?? null,
        // Mais de um lançamento no mês: não dá pra editar como uma linha só.
        multiplos: doMes.length > 1 ? doMes.length : 0,
        valores: {
          investimento: r ? Number(r.investimento) : 0,
          leads: r?.leads ?? 0,
          vendas_campanha_interna: r?.vendas_campanha_interna ?? 0,
          vendas_trafego_pago: r?.vendas_trafego_pago ?? 0,
          faturamento_campanha_interna: r ? Number(r.faturamento_campanha_interna) : 0,
          faturamento_trafego_pago: r ? Number(r.faturamento_trafego_pago) : 0,
          observacao: r?.observacao ?? "",
        },
      };
    })
    .sort((a, b) => a.grupoNome.localeCompare(b.grupoNome, "pt-BR"));

  const idsNaTela = new Set(linhas.map((l) => l.grupoId));
  const outrosAtivos = (grupos ?? [])
    .filter((g) => g.status === "Ativo" && !idsNaTela.has(g.id))
    .map((g) => ({ id: g.id, nome: displayGroupName(g.nome) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const [ano, m] = mes.split("-").map(Number);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-7">
      <div className="flex flex-col gap-3.5">
        <Link href="/resultados" prefetch={false} className="w-fit text-[13px] text-muted hover:text-text">
          Resultados
        </Link>
        <PageHeader
          titulo="Lançar resultados"
          ajuda={
            <p>
              Uma linha por grupo ativo com tráfego pago, mais quem já tem lançamento no mês.
              Grupos com lançamento vêm preenchidos e podem ser corrigidos. Salvar grava só as
              linhas alteradas, na mesma tabela do lançamento individual; lançamento novo entra
              com a data do último dia do mês.
            </p>
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <Link href={`/resultados/lancar?mes=${anterior}`} prefetch={false} className="btn-secondary h-9 px-3" aria-label="Mês anterior">
          ‹
        </Link>
        <span className="min-w-40 text-center text-[15px] font-medium text-text">{formatMesAno(ano, m)}</span>
        <Link href={`/resultados/lancar?mes=${proximo}`} prefetch={false} className="btn-secondary h-9 px-3" aria-label="Próximo mês">
          ›
        </Link>
      </div>

      <LancamentoEmLote key={mes} mes={mes} linhasIniciais={linhas} outrosAtivos={outrosAtivos} />
    </div>
  );
}
