import { createClient } from "@/lib/supabase/server";
import { ReunioesGlobalList } from "@/components/ReunioesGlobalList";

export default async function ReunioesGlobaisPage() {
  const supabase = await createClient();

  const [
    { data: grupos },
    { data: responsaveis },
    { data: reunioes },
    { data: participantes },
  ] = await Promise.all([
    supabase.from("grupos_gestao").select("id, nome").order("nome"),
    supabase.from("responsaveis").select("*").order("nome"),
    supabase
      .from("reunioes")
      .select(
        "id, grupo_id, data, hora, resumo, compareceu, link_reuniao, responsavel_id, grupos_gestao(nome)"
      )
      .order("data", { ascending: false }),
    supabase
      .from("reuniao_participantes")
      .select("reuniao_id, mentorados(nome)"),
  ]);

  type ReuniaoRow = {
    id: string;
    grupo_id: string;
    data: string;
    hora: string | null;
    resumo: string;
    compareceu: boolean;
    link_reuniao: string | null;
    responsavel_id: string | null;
    grupos_gestao: { nome: string } | null;
  };

  type ParticipanteRow = { reuniao_id: string; mentorados: { nome: string } | null };

  const responsavelPorId = new Map((responsaveis ?? []).map((r) => [r.id, r.nome]));

  const participantesPorReuniao = new Map<string, string[]>();
  for (const p of (participantes ?? []) as unknown as ParticipanteRow[]) {
    if (!p.mentorados) continue;
    const lista = participantesPorReuniao.get(p.reuniao_id) ?? [];
    lista.push(p.mentorados.nome);
    participantesPorReuniao.set(p.reuniao_id, lista);
  }

  const linhas = ((reunioes ?? []) as unknown as ReuniaoRow[]).map((r) => ({
    id: r.id,
    grupoId: r.grupo_id,
    grupoNome: r.grupos_gestao?.nome ?? "—",
    data: r.data,
    hora: r.hora,
    resumo: r.resumo,
    compareceu: r.compareceu,
    linkReuniao: r.link_reuniao,
    responsavelNome: r.responsavel_id
      ? responsavelPorId.get(r.responsavel_id)
      : undefined,
    participantes: participantesPorReuniao.get(r.id) ?? [],
  }));

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Reuniões
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Todas as reuniões de todos os grupos — agendadas e já realizadas — num
        só lugar.
      </p>

      <div className="mt-6">
        <ReunioesGlobalList
          reunioes={linhas}
          grupos={grupos ?? []}
          responsaveis={responsaveis ?? []}
        />
      </div>
    </div>
  );
}
