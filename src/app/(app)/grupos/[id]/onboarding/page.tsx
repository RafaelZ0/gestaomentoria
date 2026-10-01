import { createClient } from "@/lib/supabase/server";
import { getGrupo } from "@/lib/data/grupo";
import { OnboardingApp } from "@/components/onboarding/OnboardingApp";
import { OnboardingInicio } from "@/components/onboarding/OnboardingInicio";
import { LinhaDeBase } from "@/components/onboarding/LinhaDeBase";
import type { OnboardingPrecisao, OnboardingValores } from "@/lib/onboarding";

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ver?: string }>;
}) {
  const { id } = await params;
  const { ver } = await searchParams;
  const supabase = await createClient();

  const [grupo, { data: onboarding }, { data: mentorados }] = await Promise.all([
    getGrupo(id),
    supabase
      .from("onboardings")
      .select("*")
      .eq("grupo_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("mentorados").select("id, nome").eq("grupo_id", id).order("nome"),
  ]);

  if (!onboarding) {
    const alunoSugerido =
      mentorados?.[0]?.nome ?? (grupo?.nome ?? "").replace(/^GEST[ÃA]O\s+/i, "");
    const { data: responsaveis } = await supabase
      .from("responsaveis")
      .select("id, nome")
      .order("nome");
    return (
      <OnboardingInicio
        grupoId={id}
        alunoSugerido={alunoSugerido}
        clinicaSugerida=""
        responsaveis={(responsaveis ?? []).map((r) => ({
          id: r.id,
          nome: r.nome.trim().toLowerCase() === "pablo" ? "Dr. Pablo" : r.nome,
        }))}
      />
    );
  }

  const [{ data: participantes }, { data: resultados }] = await Promise.all([
    onboarding.reuniao_id
      ? supabase
          .from("reuniao_participantes")
          .select("mentorado_id")
          .eq("reuniao_id", onboarding.reuniao_id)
      : Promise.resolve({ data: [] as { mentorado_id: string }[] }),
    supabase
      .from("resultados_grupo")
      .select("data, leads, vendas_campanha_interna, vendas_trafego_pago, faturamento_campanha_interna, faturamento_trafego_pago")
      .eq("grupo_id", id),
  ]);

  // Mês mais recente com lançamento (soma do mês) pra "Linha de base × hoje".
  const porMes = new Map<string, { leads: number; vendas: number; faturamento: number }>();
  for (const r of resultados ?? []) {
    const mes = r.data.slice(0, 7);
    const a = porMes.get(mes) ?? { leads: 0, vendas: 0, faturamento: 0 };
    a.leads += r.leads;
    a.vendas += r.vendas_campanha_interna + r.vendas_trafego_pago;
    a.faturamento += Number(r.faturamento_campanha_interna) + Number(r.faturamento_trafego_pago);
    porMes.set(mes, a);
  }
  const mesMaisRecente = [...porMes.keys()].sort().at(-1);
  const ultimo = mesMaisRecente ? { mes: mesMaisRecente, ...porMes.get(mesMaisRecente)! } : null;

  const modoInicial =
    ver === "raio-x" || (ver !== "preencher" && onboarding.status === "concluido")
      ? "raio-x"
      : "preencher";

  return (
    <div className="flex flex-col gap-8">
      <OnboardingApp
        key={onboarding.id}
        onboardingId={onboarding.id}
        grupoId={id}
        reuniaoId={onboarding.reuniao_id}
        statusInicial={onboarding.status}
        respostasIniciais={(onboarding.respostas ?? {}) as OnboardingValores}
        precisaoIniciais={(onboarding.precisao ?? {}) as OnboardingPrecisao}
        modoInicial={modoInicial}
        mentorados={mentorados ?? []}
        participantesIniciais={(participantes ?? []).map((p) => p.mentorado_id)}
      />
      {ultimo && (
        <LinhaDeBase
          respostas={(onboarding.respostas ?? {}) as OnboardingValores}
          precisao={(onboarding.precisao ?? {}) as OnboardingPrecisao}
          ultimo={ultimo}
        />
      )}
    </div>
  );
}
