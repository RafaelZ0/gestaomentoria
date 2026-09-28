import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import {
  calcularGruposParaAgendar,
  calcularGruposPorReuniao,
  calcularSemSinalDeVida,
} from "@/lib/agendaStatus";
import { displayGroupName } from "@/lib/format";
import type { NotificacaoAgendar, NotificacaoHoje } from "@/components/AvisosPainel";

// Passado esse número de dias sem reunião própria e sem nenhuma reunião
// futura já agendada, avisa que está na hora de marcar a próxima — mais
// cedo que o "sem sinal de vida" (+30d) porque aqui a ideia é agir antes
// de virar um sinal de alerta mais sério.
export const DIAS_PARA_AGENDAR = 20;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const [
    { data: gruposAtivos },
    { data: reunioes },
    { data: participantes },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase.from("grupos_gestao").select("id, nome").eq("status", "Ativo"),
    supabase
      .from("reunioes")
      .select("id, grupo_id, data, compareceu, hora, grupos_gestao(nome)"),
    supabase.from("reuniao_participantes").select("reuniao_id, mentorados(grupo_id)"),
    supabase.auth.getUser(),
  ]);

  type ReuniaoRow = {
    id: string;
    grupo_id: string;
    data: string;
    compareceu: boolean;
    hora: string | null;
    grupos_gestao: { nome: string } | null;
  };
  type ParticipanteRow = { reuniao_id: string; mentorados: { grupo_id: string } | null };

  const reunioesRows = (reunioes ?? []) as unknown as ReuniaoRow[];
  const gruposPorReuniao = calcularGruposPorReuniao(
    reunioesRows,
    (participantes ?? []) as unknown as ParticipanteRow[]
  );

  const notifAgendar: NotificacaoAgendar[] = calcularGruposParaAgendar(
    gruposAtivos ?? [],
    reunioesRows,
    gruposPorReuniao,
    hoje,
    DIAS_PARA_AGENDAR
  ).map((g) => ({ ...g, nome: displayGroupName(g.nome) }));

  const notifHoje: NotificacaoHoje[] = reunioesRows
    .filter((r) => r.data === hoje && r.compareceu)
    .map((r) => ({
      reuniaoId: r.id,
      grupoId: r.grupo_id,
      grupoNome: displayGroupName(r.grupos_gestao?.nome),
      hora: r.hora,
    }));

  const semReuniao = calcularSemSinalDeVida(
    gruposAtivos ?? [],
    reunioesRows,
    gruposPorReuniao
  ).map((g) => ({ ...g, nome: displayGroupName(g.nome) }));

  return (
    <div className="flex min-h-screen w-full flex-col min-[900px]:flex-row">
      <Sidebar
        notifAgendar={notifAgendar}
        notifHoje={notifHoje}
        semReuniao={semReuniao}
        email={user?.email ?? null}
      />
      <main className="min-w-0 flex-1 px-5 py-8 min-[900px]:px-16 min-[900px]:py-14">
        {children}
      </main>
    </div>
  );
}
