"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  pontos,
  texto,
  type OnboardingPrecisao,
  type OnboardingValores,
} from "@/lib/onboarding";

type Resultado<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const RESUMO_INICIAL = "Reunião de onboarding: diagnóstico da clínica";

function revalidarGrupo(grupoId: string) {
  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath(`/grupos/${grupoId}/onboarding`);
  revalidatePath(`/grupos/${grupoId}/reunioes`);
  revalidatePath("/reunioes");
  revalidatePath("/agenda");
  revalidatePath("/grupos");
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function dataValida(v: unknown): string {
  const s = texto(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : hojeISO();
}

async function criarOnboardingComReuniao(
  grupoId: string,
  respostas: OnboardingValores,
  precisao: OnboardingPrecisao
): Promise<Resultado<{ id: string }>> {
  const supabase = await createClient();

  const { data: reuniao, error: erroReuniao } = await supabase
    .from("reunioes")
    .insert({ grupo_id: grupoId, resumo: RESUMO_INICIAL, data: dataValida(respostas.data) })
    .select("id")
    .single();

  if (erroReuniao || !reuniao) {
    return { ok: false, error: "Não consegui criar a reunião de onboarding." };
  }

  const { data: onboarding, error } = await supabase
    .from("onboardings")
    .insert({ grupo_id: grupoId, reuniao_id: reuniao.id, respostas, precisao })
    .select("id")
    .single();

  if (error || !onboarding) {
    // Não deixa uma reunião órfã se o diagnóstico não foi criado.
    await supabase.from("reunioes").delete().eq("id", reuniao.id);
    return { ok: false, error: "Não consegui criar o diagnóstico." };
  }

  revalidarGrupo(grupoId);
  return { ok: true, id: onboarding.id };
}

export async function iniciarOnboarding(
  grupoId: string,
  aluno: string,
  clinica: string
): Promise<Resultado<{ id: string }>> {
  const nome = aluno.trim();
  if (!nome) return { ok: false, error: "Informe o nome do dentista para começar." };
  return criarOnboardingComReuniao(
    grupoId,
    { aluno: nome, clinica: clinica.trim(), data: hojeISO() },
    {}
  );
}

export async function importarOnboarding(
  grupoId: string,
  respostas: OnboardingValores,
  precisao: OnboardingPrecisao
): Promise<Resultado<{ id: string }>> {
  if (!texto(respostas.aluno).trim()) {
    return {
      ok: false,
      error: 'Não encontrei o "Nome do dentista" no documento. Confira se o arquivo segue o modelo.',
    };
  }
  return criarOnboardingComReuniao(grupoId, respostas, precisao);
}

export async function salvarOnboarding(
  id: string,
  respostas: OnboardingValores,
  precisao: OnboardingPrecisao
): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("onboardings")
    .update({ respostas, precisao, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: "Erro ao salvar." };
  return { ok: true };
}

export async function salvarParticipantesOnboarding(
  grupoId: string,
  reuniaoId: string,
  mentoradoIds: string[]
): Promise<Resultado> {
  const supabase = await createClient();

  const { error: erroDelete } = await supabase
    .from("reuniao_participantes")
    .delete()
    .eq("reuniao_id", reuniaoId);
  if (erroDelete) return { ok: false, error: "Erro ao salvar participantes." };

  if (mentoradoIds.length > 0) {
    const { error } = await supabase
      .from("reuniao_participantes")
      .insert(mentoradoIds.map((mentorado_id) => ({ reuniao_id: reuniaoId, mentorado_id })));
    if (error) return { ok: false, error: "Erro ao salvar participantes." };
  }

  revalidarGrupo(grupoId);
  return { ok: true };
}

export async function concluirOnboarding(
  id: string,
  grupoId: string,
  reuniaoId: string | null,
  respostas: OnboardingValores,
  precisao: OnboardingPrecisao
): Promise<Resultado> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("onboardings")
    .update({
      status: "concluido",
      respostas,
      precisao,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: "Erro ao concluir o diagnóstico." };

  if (reuniaoId) {
    const pts = pontos(respostas, precisao);
    const foco = texto(respostas.indicador);
    const partes = [
      "Onboarding: diagnóstico da clínica concluído.",
      foco && foco !== "Ainda não sei" ? `Foco dos 90 dias: ${foco.toLowerCase()}.` : "",
      pts.length ? `Pontos: ${pts.slice(0, 3).join(" ")}` : "",
    ].filter(Boolean);

    await supabase
      .from("reunioes")
      .update({ resumo: partes.join(" "), data: dataValida(respostas.data) })
      .eq("id", reuniaoId);
  }

  revalidarGrupo(grupoId);
  return { ok: true };
}
