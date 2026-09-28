import { createClient } from "@/lib/supabase/server";
import { getGrupo } from "@/lib/data/grupo";
import { OnboardingApp } from "@/components/onboarding/OnboardingApp";
import { OnboardingInicio } from "@/components/onboarding/OnboardingInicio";
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
    return (
      <OnboardingInicio grupoId={id} alunoSugerido={alunoSugerido} clinicaSugerida="" />
    );
  }

  const { data: participantes } = onboarding.reuniao_id
    ? await supabase
        .from("reuniao_participantes")
        .select("mentorado_id")
        .eq("reuniao_id", onboarding.reuniao_id)
    : { data: [] };

  const modoInicial =
    ver === "raio-x" || (ver !== "preencher" && onboarding.status === "concluido")
      ? "raio-x"
      : "preencher";

  return (
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
  );
}
