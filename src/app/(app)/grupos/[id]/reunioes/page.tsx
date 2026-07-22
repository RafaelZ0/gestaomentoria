import { createClient } from "@/lib/supabase/server";
import { NovaReuniaoForm } from "@/components/NovaReuniaoForm";
import { ReuniaoItem } from "@/components/ReuniaoItem";
import { ComparecimentoResumo } from "@/components/ComparecimentoResumo";
import { getGrupo } from "@/lib/data/grupo";

export default async function ReunioesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    grupoAtual,
    { data: mentoradosDoGrupo },
    { data: mentoradosOutrosGrupos },
    { data: responsaveis },
    { data: reunioesProprias },
    { data: participacoesExternas },
    { data: entregasPendentes },
  ] = await Promise.all([
    getGrupo(id),
    supabase
      .from("mentorados")
      .select("id, nome")
      .eq("grupo_id", id)
      .order("nome"),
    supabase
      .from("mentorados")
      .select("id, nome, grupo_id, grupos_gestao(nome, status, data_termino)")
      .neq("grupo_id", id)
      .order("nome"),
    supabase.from("responsaveis").select("*").order("nome"),
    supabase
      .from("reunioes")
      .select("*")
      .eq("grupo_id", id)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("reuniao_participantes")
      .select("reuniao_id, mentorados!inner(grupo_id)")
      .eq("mentorados.grupo_id", id),
    supabase
      .from("entregas_grupo")
      .select("tipo_entrega_id, tipos_entrega(id, nome, ativo)")
      .eq("grupo_id", id)
      .eq("feito", false),
  ]);

  type PendenteRow = {
    tipo_entrega_id: string;
    tipos_entrega: { id: string; nome: string; ativo: boolean } | null;
  };

  const pendentes = ((entregasPendentes ?? []) as unknown as PendenteRow[])
    .filter((e) => e.tipos_entrega?.ativo)
    .map((e) => ({ id: e.tipo_entrega_id, nome: e.tipos_entrega!.nome }));

  type ParticipacaoExternaRow = { reuniao_id: string };

  const idsProprias = new Set((reunioesProprias ?? []).map((r) => r.id));
  const idsExternas = [
    ...new Set(
      ((participacoesExternas ?? []) as unknown as ParticipacaoExternaRow[])
        .map((p) => p.reuniao_id)
        .filter((rid) => !idsProprias.has(rid))
    ),
  ];

  const { data: reunioesExternas } =
    idsExternas.length > 0
      ? await supabase.from("reunioes").select("*").in("id", idsExternas)
      : { data: [] };

  const reunioes = [...(reunioesProprias ?? []), ...(reunioesExternas ?? [])].sort(
    (a, b) => b.data.localeCompare(a.data) || b.created_at.localeCompare(a.created_at)
  );

  const reuniaoIds = reunioes.map((r) => r.id);
  const { data: todosParticipantes } =
    reuniaoIds.length > 0
      ? await supabase
          .from("reuniao_participantes")
          .select("reuniao_id, mentorados(id, nome, grupo_id, grupos_gestao(nome))")
          .in("reuniao_id", reuniaoIds)
      : { data: [] };

  type ParticipanteRow = {
    reuniao_id: string;
    mentorados: {
      id: string;
      nome: string;
      grupo_id: string;
      grupos_gestao: { nome: string } | null;
    } | null;
  };

  const participantesPorReuniao = new Map<
    string,
    { id: string; nome: string; grupoNome: string; deOutroGrupo: boolean }[]
  >();
  for (const p of (todosParticipantes ?? []) as unknown as ParticipanteRow[]) {
    if (!p.mentorados) continue;
    const lista = participantesPorReuniao.get(p.reuniao_id) ?? [];
    lista.push({
      id: p.mentorados.id,
      nome: p.mentorados.nome,
      grupoNome: p.mentorados.grupos_gestao?.nome ?? "",
      deOutroGrupo: p.mentorados.grupo_id !== id,
    });
    participantesPorReuniao.set(p.reuniao_id, lista);
  }

  const responsavelPorId = new Map(
    (responsaveis ?? []).map((r) => [r.id, r.nome])
  );

  type MentoradoOutroGrupo = {
    id: string;
    nome: string;
    grupo_id: string;
    grupos_gestao: { nome: string; status: string; data_termino: string | null } | null;
  };

  const mentoradosOutrosGruposFormatado = (
    (mentoradosOutrosGrupos ?? []) as unknown as MentoradoOutroGrupo[]
  ).map((m) => ({
    id: m.id,
    nome: m.nome,
    grupoNome: m.grupos_gestao?.nome ?? "",
    grupoStatus: m.grupos_gestao?.status ?? "Ativo",
    grupoDataTermino: m.grupos_gestao?.data_termino ?? null,
  }));

  const totalAgendadas = (reunioesProprias ?? []).length;
  const faltas = (reunioesProprias ?? []).filter((r) => !r.compareceu).length;

  return (
    <div className="space-y-6">
      <ComparecimentoResumo totalAgendadas={totalAgendadas} faltas={faltas} />

      <NovaReuniaoForm
        grupoId={id}
        entregasPendentes={pendentes}
        mentoradosDoGrupo={mentoradosDoGrupo ?? []}
        grupoStatus={grupoAtual?.status ?? "Ativo"}
        grupoDataTermino={grupoAtual?.data_termino ?? null}
        mentoradosOutrosGrupos={mentoradosOutrosGruposFormatado}
        responsaveis={responsaveis ?? []}
      />

      <ul className="space-y-3">
        {reunioes.map((r) => (
          <ReuniaoItem
            key={r.id}
            reuniao={r}
            participantes={participantesPorReuniao.get(r.id) ?? []}
            responsavelNome={
              r.responsavel_id ? responsavelPorId.get(r.responsavel_id) : undefined
            }
            mentoradosDoGrupo={mentoradosDoGrupo ?? []}
            grupoStatus={grupoAtual?.status ?? "Ativo"}
            grupoDataTermino={grupoAtual?.data_termino ?? null}
            mentoradosOutrosGrupos={mentoradosOutrosGruposFormatado}
            responsaveis={responsaveis ?? []}
          />
        ))}
        {reunioes.length === 0 && (
          <p className="text-sm text-text-secondary">
            Nenhuma reunião registrada ainda.
          </p>
        )}
      </ul>
    </div>
  );
}
