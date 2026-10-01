import { Sidebar } from "@/components/Sidebar";
import { AgendamentoProvider } from "@/components/AgendamentoProvider";
import { BuscaRapida } from "@/components/BuscaRapida";
import { createClient } from "@/lib/supabase/server";
import { getAvisos } from "@/lib/data/avisos";
import { displayGroupName } from "@/lib/format";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const [
    avisos,
    { data: grupos },
    { data: mentorados },
    { data: responsaveis },
    {
      data: { user },
    },
  ] = await Promise.all([
    getAvisos(),
    supabase.from("grupos_gestao").select("id, nome, status").order("nome"),
    supabase.from("mentorados").select("nome, grupo_id").order("nome"),
    supabase.from("responsaveis").select("id, nome").order("nome"),
    supabase.auth.getUser(),
  ]);

  const pabloId =
    (responsaveis ?? []).find((r) => r.nome.trim().toLowerCase() === "pablo")?.id ?? null;

  const gruposExibicao = (grupos ?? [])
    .map((g) => ({ id: g.id, nome: displayGroupName(g.nome), ativo: g.status === "Ativo" }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <AgendamentoProvider
      grupos={gruposExibicao.filter((g) => g.ativo)}
      responsaveis={(responsaveis ?? []).map((r) => ({
        id: r.id,
        nome: r.id === pabloId ? "Dr. Pablo" : r.nome,
      }))}
      pabloId={pabloId}
      hoje={hoje}
    >
      <div className="flex min-h-screen w-full flex-col min-[900px]:flex-row">
        <Sidebar avisos={avisos} email={user?.email ?? null} />
        <main className="min-w-0 flex-1 px-5 py-8 min-[900px]:px-16 min-[900px]:py-14">
          {children}
        </main>
      </div>
      <BuscaRapida
        grupos={gruposExibicao}
        mentorados={(mentorados ?? []).map((m) => ({ nome: m.nome, grupoId: m.grupo_id }))}
      />
    </AgendamentoProvider>
  );
}
