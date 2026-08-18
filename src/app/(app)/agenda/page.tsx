import { createClient } from "@/lib/supabase/server";
import {
  gerarGradeMes,
  mesAnterior,
  proximoMes,
  formatMesAnoLongo,
} from "@/lib/calendario";
import { CalendarioAgenda, type ReuniaoDoDia } from "@/components/CalendarioAgenda";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const hoje = new Date();
  let ano = hoje.getFullYear();
  let mes = hoje.getMonth() + 1;

  if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
    const [anoStr, mesStr] = mesParam.split("-");
    ano = Number(anoStr);
    mes = Number(mesStr);
  }

  const semanas = gerarGradeMes(ano, mes - 1);
  const dias = semanas.flat();
  const dataInicio = dias[0];
  const dataFim = dias[dias.length - 1];

  const supabase = await createClient();

  const [{ data: reunioes }, { data: responsaveis }, { data: grupos }] =
    await Promise.all([
      supabase
        .from("reunioes")
        .select("id, data, hora, responsavel_id, link_reuniao, grupos_gestao(nome)")
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
      grupoNome: r.grupos_gestao?.nome ?? "—",
      responsavelId: r.responsavel_id,
      responsavelNome: r.responsavel_id
        ? (responsavelPorId.get(r.responsavel_id) ?? null)
        : null,
      linkReuniao: r.link_reuniao,
    });
    reunioesPorDia[r.data] = lista;
  }

  const anterior = mesAnterior(ano, mes);
  const proximo = proximoMes(ano, mes);

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
        Agenda
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Calendário com as reuniões marcadas e os horários livres do Pablo,
        conforme a grade fixa dele. Clique num dia pra ver os detalhes e
        agendar.
      </p>

      <div className="mt-4">
        <CalendarioAgenda
          semanas={semanas}
          mesAtual={mes}
          reunioesPorDia={reunioesPorDia}
          pabloId={pablo?.id ?? null}
          grupos={grupos ?? []}
          tituloMes={formatMesAnoLongo(ano, mes)}
          hrefMesAnterior={`/agenda?mes=${anterior.ano}-${String(anterior.mes).padStart(2, "0")}`}
          hrefProximoMes={`/agenda?mes=${proximo.ano}-${String(proximo.mes).padStart(2, "0")}`}
          hoje={hoje.toISOString().slice(0, 10)}
        />
      </div>
    </div>
  );
}
