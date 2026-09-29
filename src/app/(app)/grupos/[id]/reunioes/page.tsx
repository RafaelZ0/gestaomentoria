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

  const { data: reunioesExternasRaw } =
    idsExternas.length > 0
      ? await supabase
          .from("reunioes")
          .select("*, grupos_gestao(nome)")
          .in("id", idsExternas)
      : { data: [] };

  type ReuniaoExternaRow = {
    id: string;
    grupos_gestao: { nome: string } | null;
  };

  const grupoOrigemPorReuniao = new Map<string, string>();
  for (const r of (reunioesExternasRaw ??
    []) as unknown as ReuniaoExternaRow[]) {
    if (r.grupos_gestao?.nome) {
      grupoOrigemPorReuniao.set(r.id, r.grupos_gestao.nome);
    }
  }

  const reunioesExternas = reunioesExternasRaw ?? [];

  const reunioes = [...(reunioesProprias ?? []), ...reunioesExternas].sort(
    (a, b) => b.data.localeCompare(a.data) || b.created_at.localeCompare(a.created_at)
  );

  const reuniaoIds = reunioes.map((r) => r.id);
  const [{ data: todosParticipantes }, { data: onboardingsDasReunioes }] =
    reuniaoIds.length > 0
      ? await Promise.all([
          supabase
            .from("reuniao_participantes")
            .select("reuniao_id, mentorados(id, nome, grupo_id, grupos_gestao(nome))")
            .in("reuniao_id", reuniaoIds),
          supabase
            .from("onboardings")
            .select("reuniao_id, grupo_id")
            .in("reuniao_id", reuniaoIds),
        ])
      : [{ data: [] }, { data: [] }];

  // A reunião é de onboarding quando tem um diagnóstico apontando pra ela.
  const onboardingPorReuniao = new Map<string, string>();
  for (const o of onboardingsDasReunioes ?? []) {
    if (o.reuniao_id) {
      onboardingPorReuniao.set(o.reuniao_id, `/grupos/${o.grupo_id}/onboarding?ver=raio-x`);
    }
  }

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

  const hoje = new Date().toISOString().slice(0, 10);
  const proximas = reunioes
    .filter((r) => r.data > hoje && r.compareceu)
    .sort((a, b) => a.data.localeCompare(b.data));
  const historico = reunioes.filter((r) => !(r.data > hoje && r.compareceu));

  // Reuniões agendadas conta própria + participação como convidado em
  // reunião de outro grupo, mas só do histórico (reuniões futuras ainda não
  // aconteceram, então não entram na estatística de comparecimento).
  // Faltas só considera reuniões próprias — uma participação externa nunca
  // é falta, já que só aparece na lista se o mentorado de fato participou.
  const totalAgendadas = historico.length;
  const faltas = (reunioesProprias ?? []).filter(
    (r) => !(r.data > hoje && r.compareceu) && !r.compareceu
  ).length;

  function renderItem(r: (typeof reunioes)[number]) {
    return (
      <ReuniaoItem
        key={r.id}
        reuniao={r}
        grupoNome={grupoOrigemPorReuniao.get(r.id) ?? grupoAtual?.nome ?? ""}
        grupoOrigemNome={grupoOrigemPorReuniao.get(r.id)}
        participantes={participantesPorReuniao.get(r.id) ?? []}
        responsavelNome={
          r.responsavel_id ? responsavelPorId.get(r.responsavel_id) : undefined
        }
        mentoradosDoGrupo={mentoradosDoGrupo ?? []}
        grupoStatus={grupoAtual?.status ?? "Ativo"}
        grupoDataTermino={grupoAtual?.data_termino ?? null}
        mentoradosOutrosGrupos={mentoradosOutrosGruposFormatado}
        responsaveis={responsaveis ?? []}
        onboardingHref={onboardingPorReuniao.get(r.id)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
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

      {proximas.length > 0 && (
        <section className="flex flex-col">
          <h2 className="border-b border-line pb-2 text-[15px] font-semibold text-text">
            Próximas reuniões
          </h2>
          <ul className="flex flex-col">{proximas.map(renderItem)}</ul>
        </section>
      )}

      <section className="flex flex-col">
        <h2 className="border-b border-line pb-2 text-[15px] font-semibold text-text">
          Histórico
        </h2>
        <ul className="flex flex-col">
          {historico.map(renderItem)}
          {reunioes.length === 0 && (
            <p className="py-4 text-sm text-muted">Nenhuma reunião registrada ainda.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
