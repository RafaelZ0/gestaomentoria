import { createClient } from "@/lib/supabase/server";
import { diasDaSemana } from "@/lib/calendario";
import {
  calcularGruposParaAgendar,
  calcularGruposPorReuniao,
} from "@/lib/agendaStatus";
import { DIAS_PARA_AGENDAR } from "@/app/(app)/layout";
import { CalendarioAgenda, type ReuniaoDoDia } from "@/components/CalendarioAgenda";
import type { ProximaReuniao } from "@/components/AgendaResumo";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const { data: dataParam } = await searchParams;
  const hoje = new Date().toISOString().slice(0, 10);

  const dataRef =
    dataParam && /^\d{4}-\d{2}-\d{2}$/.test(dataParam) ? dataParam : hoje;

  const dias = diasDaSemana(dataRef);
  const dataInicio = dias[0];
  const dataFim = dias[6];

  const supabase = await createClient();

  const [
    { data: reunioesDaSemana },
    { data: responsaveis },
    { data: grupos },
    { data: todasReunioes },
    { data: participantes },
  ] = await Promise.all([
    supabase
      .from("reunioes")
      .select(
        "id, grupo_id, data, hora, duracao_min, responsavel_id, link_reuniao, resumo, grupos_gestao(nome)"
      )
      .gte("data", dataInicio)
      .lte("data", dataFim),
    supabase.from("responsaveis").select("*").order("nome"),
    supabase
      .from("grupos_gestao")
      .select("id, nome")
      .eq("status", "Ativo")
      .order("nome"),
    supabase
      .from("reunioes")
      .select(
        "id, grupo_id, data, hora, compareceu, responsavel_id, link_reuniao, grupos_gestao(nome)"
      ),
    supabase
      .from("reuniao_participantes")
      .select("reuniao_id, mentorados(grupo_id)"),
  ]);

  type ReuniaoRow = {
    id: string;
    grupo_id: string;
    data: string;
    hora: string | null;
    duracao_min: number;
    responsavel_id: string | null;
    link_reuniao: string | null;
    resumo: string | null;
    grupos_gestao: { nome: string } | null;
  };

  type TodaReuniaoRow = {
    id: string;
    grupo_id: string;
    data: string;
    hora: string | null;
    compareceu: boolean;
    responsavel_id: string | null;
    link_reuniao: string | null;
    grupos_gestao: { nome: string } | null;
  };

  type ParticipanteRow = { reuniao_id: string; mentorados: { grupo_id: string } | null };

  const responsavelPorId = new Map(
    (responsaveis ?? []).map((r) => [r.id, r.nome])
  );
  const pablo = (responsaveis ?? []).find(
    (r) => r.nome.trim().toLowerCase() === "pablo"
  );

  const reunioesPorDia: Record<string, ReuniaoDoDia[]> = {};
  for (const r of (reunioesDaSemana ?? []) as unknown as ReuniaoRow[]) {
    const lista = reunioesPorDia[r.data] ?? [];
    lista.push({
      id: r.id,
      grupoId: r.grupo_id,
      hora: r.hora,
      duracaoMin: r.duracao_min,
      grupoNome: r.grupos_gestao?.nome ?? "—",
      responsavelId: r.responsavel_id,
      responsavelNome: r.responsavel_id
        ? (responsavelPorId.get(r.responsavel_id) ?? null)
        : null,
      linkReuniao: r.link_reuniao,
      resumo: r.resumo ?? "",
    });
    reunioesPorDia[r.data] = lista;
  }

  const todasReunioesRows = (todasReunioes ?? []) as unknown as TodaReuniaoRow[];
  const gruposPorReuniao = calcularGruposPorReuniao(
    todasReunioesRows,
    (participantes ?? []) as unknown as ParticipanteRow[]
  );
  const paraAgendar = calcularGruposParaAgendar(
    grupos ?? [],
    todasReunioesRows,
    gruposPorReuniao,
    hoje,
    DIAS_PARA_AGENDAR
  );

  const proximas: ProximaReuniao[] = todasReunioesRows
    .filter((r) => r.data >= hoje && r.compareceu)
    .sort((a, b) => (a.data + (a.hora ?? "")).localeCompare(b.data + (b.hora ?? "")))
    .slice(0, 10)
    .map((r) => ({
      id: r.id,
      grupoId: r.grupo_id,
      grupoNome: r.grupos_gestao?.nome ?? "—",
      data: r.data,
      hora: r.hora,
      responsavelNome: r.responsavel_id
        ? (responsavelPorId.get(r.responsavel_id) ?? null)
        : null,
      linkReuniao: r.link_reuniao,
    }));

  const [anoRef, mesRef] = dataRef.split("-").map(Number);

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text">
        Agenda
      </h1>
      <p className="mt-1 text-sm text-text-2">
        Reuniões do Rafael e do Dr. Pablo e os compromissos da clínica, na
        mesma semana. Clique em qualquer horário pra agendar.
      </p>

      <div className="mt-4">
        <CalendarioAgenda
          dias={dias}
          reunioesPorDia={reunioesPorDia}
          pabloId={pablo?.id ?? null}
          responsaveis={(responsaveis ?? []).map((r) => ({ id: r.id, nome: r.nome }))}
          grupos={grupos ?? []}
          hoje={hoje}
          miniAno={anoRef}
          miniMes={mesRef}
          proximas={proximas}
          paraAgendar={paraAgendar}
        />
      </div>
    </div>
  );
}
