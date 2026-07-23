import { Sidebar } from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";
import type {
  NotificacaoAgendar,
  NotificacaoHoje,
} from "@/components/NotificationBell";

// Passado esse número de dias sem reunião própria e sem nenhuma reunião
// futura já agendada, avisa que está na hora de marcar a próxima — mais
// cedo que o "sem sinal de vida" (+30d) porque aqui a ideia é agir antes
// de virar um sinal de alerta mais sério.
const DIAS_PARA_AGENDAR = 20;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const [{ data: gruposAtivos }, { data: reunioes }] = await Promise.all([
    supabase.from("grupos_gestao").select("id, nome").eq("status", "Ativo"),
    supabase
      .from("reunioes")
      .select("id, grupo_id, data, compareceu, hora, grupos_gestao(nome)"),
  ]);

  type ReuniaoRow = {
    id: string;
    grupo_id: string;
    data: string;
    compareceu: boolean;
    hora: string | null;
    grupos_gestao: { nome: string } | null;
  };

  const reunioesRows = (reunioes ?? []) as unknown as ReuniaoRow[];

  const porGrupo = new Map<string, { ultima: string | null; temFutura: boolean }>();
  for (const g of gruposAtivos ?? []) {
    porGrupo.set(g.id, { ultima: null, temFutura: false });
  }
  for (const r of reunioesRows) {
    const info = porGrupo.get(r.grupo_id);
    if (!info) continue;
    if (r.data > hoje && r.compareceu) info.temFutura = true;
    if (r.data <= hoje && (!info.ultima || r.data > info.ultima)) {
      info.ultima = r.data;
    }
  }

  function diasDesde(data: string) {
    return Math.floor(
      (Date.now() - new Date(data + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  const notifAgendar: NotificacaoAgendar[] = (gruposAtivos ?? [])
    .filter((g) => {
      const info = porGrupo.get(g.id)!;
      if (info.temFutura) return false;
      if (!info.ultima) return true;
      return diasDesde(info.ultima) > DIAS_PARA_AGENDAR;
    })
    .map((g) => {
      const ultima = porGrupo.get(g.id)!.ultima;
      return {
        id: g.id,
        nome: g.nome,
        diasSemReuniao: ultima ? diasDesde(ultima) : null,
      };
    });

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
