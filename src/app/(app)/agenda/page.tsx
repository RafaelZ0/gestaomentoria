import { createClient } from "@/lib/supabase/server";
import { diasDaSemana } from "@/lib/calendario";
import { CalendarioAgenda, type ReuniaoDoDia } from "@/components/CalendarioAgenda";

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

  const [{ data: reunioes }, { data: responsaveis }, { data: grupos }] =
    await Promise.all([
      supabase
        .from("reunioes")
        .select(
          "id, data, hora, duracao_min, responsavel_id, link_reuniao, grupos_gestao(nome)"
        )
        .gte("data", dataInicio)
        .lte("data", dataFim),
      supabase.from("responsaveis").select("*").order("nome"),
      supabase
        .from("grupos_gestao")
        .select("id, nome")
        .eq("status", "Ativo")
        .order("nome"),
    ]);

  type ReuniaoRow = {
    id: string;
    data: string;
    hora: string | null;
    duracao_min: number;
    responsavel_id: string | null;
    link_reuniao: string | null;
    grupos_gestao: { nome: string } | null;
  };

  const responsavelPorId = new Map(
    (responsaveis ?? []).map((r) => [r.id, r.nome])
  );
  const pablo = (responsaveis ?? []).find(
    (r) => r.nome.trim().toLowerCase() === "pablo"
  );

  const reunioesPorDia: Record<string, ReuniaoDoDia[]> = {};
  for (const r of (reunioes ?? []) as unknown as ReuniaoRow[]) {
    const lista = reunioesPorDia[r.data] ?? [];
    lista.push({
      id: r.id,
      hora: r.hora,
      duracaoMin: r.duracao_min,
      grupoNome: r.grupos_gestao?.nome ?? "—",
      responsavelId: r.responsavel_id,
      responsavelNome: r.responsavel_id
        ? (responsavelPorId.get(r.responsavel_id) ?? null)
        : null,
      linkReuniao: r.link_reuniao,
    });
    reunioesPorDia[r.data] = lista;
  }

  const [anoRef, mesRef] = dataRef.split("-").map(Number);

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Agenda
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Semana com as reuniões marcadas e os compromissos da clínica do
        Pablo (contexto). Dois cliques em qualquer intervalo de 30 min
        agenda uma reunião ali, em qualquer horário.
      </p>

      <div className="mt-4">
        <CalendarioAgenda
          dias={dias}
          reunioesPorDia={reunioesPorDia}
          pabloId={pablo?.id ?? null}
          grupos={grupos ?? []}
          hoje={hoje}
          miniAno={anoRef}
          miniMes={mesRef}
        />
      </div>
    </div>
  );
}
