import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import {
  calcularGruposParaAgendar,
  calcularGruposPorReuniao,
} from "@/lib/agendaStatus";
import type {
  NotificacaoAgendar,
  NotificacaoHoje,
} from "@/components/NotificationBell";

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

  const [{ data: gruposAtivos }, { data: reunioes }, { data: participantes }] =
    await Promise.all([
      supabase.from("grupos_gestao").select("id, nome").eq("status", "Ativo"),
      supabase
        .from("reunioes")
        .select("id, grupo_id, data, compareceu, hora, grupos_gestao(nome)"),
      supabase
        .from("reuniao_participantes")
        .select("reuniao_id, mentorados(grupo_id)"),
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
  );

  const notifHoje: NotificacaoHoje[] = reunioesRows
    .filter((r) => r.data === hoje && r.compareceu)
    .map((r) => ({
      reuniaoId: r.id,
      grupoId: r.grupo_id,
      grupoNome: r.grupos_gestao?.nome ?? "",
      hora: r.hora,
    }));

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar notifAgendar={notifAgendar} notifHoje={notifHoje} />
      <main className="flex-1 overflow-x-auto px-4 py-6 md:px-8 md:py-8">
        {children}
      </main>
    </div>
  );
}
