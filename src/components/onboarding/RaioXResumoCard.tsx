import Link from "next/link";
import { formatDate } from "@/lib/format";
import {
  STEPS,
  brl,
  funnel,
  isFilled,
  num,
  pct,
  pontos,
  texto,
  verbaStatus,
  type OnboardingPrecisao,
  type OnboardingValores,
} from "@/lib/onboarding";
import { Metric, Notice } from "@/components/ui/Metric";
import type { Onboarding } from "@/lib/database.types";

export function RaioXResumoCard({
  grupoId,
  onboarding,
}: {
  grupoId: string;
  onboarding: Onboarding | null;
}) {
  const href = `/grupos/${grupoId}/onboarding`;

  if (!onboarding) {
    return (
      <Notice
        titulo="Diagnóstico de onboarding ainda não feito"
        acao={
          <Link href={href} prefetch={false} className="link whitespace-nowrap">
            Fazer diagnóstico
          </Link>
        }
      >
        A primeira reunião de toda mentoria é o diagnóstico da clínica. O raio-X fica aqui no
        cadastro do grupo.
      </Notice>
    );
  }

  const v = onboarding.respostas as OnboardingValores;
  const p = onboarding.precisao as OnboardingPrecisao;

  if (onboarding.status !== "concluido") {
    const campos = STEPS.flatMap((s) => s.fields);
    const progresso = Math.round(
      (campos.filter((f) => isFilled(v, p, f)).length / campos.length) * 100
    );
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-surface px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14.5px] font-medium text-text">Diagnóstico em andamento</span>
            <span className="text-[13px] text-muted">
              Raio-X da clínica ainda não concluído · {progresso}% das perguntas respondidas
            </span>
          </div>
          <Link href={href} prefetch={false} className="link whitespace-nowrap text-sm">
            Continuar diagnóstico
          </Link>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-raised">
          <div className="h-full rounded-full bg-gold" style={{ width: `${progresso}%` }} />
        </div>
      </div>
    );
  }

  const F = funnel(v, p);
  const pts = pontos(v, p);
  const verba = verbaStatus(v);
  const data = texto(v.data);

  const destaques = [
    {
      rotulo: "Faturamento mensal",
      valor: p.fat === "naosei" ? "não sabe" : brl(num(v.fat)),
    },
    {
      rotulo: "Maior perda do funil",
      valor: F.worst ? `${F.worst.nome} · ${pct(F.worst.v)}` : "—",
    },
    { rotulo: "Foco dos 90 dias", valor: texto(v.indicador) || "A definir" },
    {
      rotulo: "Verba para anúncios",
      valor: verba ? (verba.ok ? `${brl(num(v.verba))}/mês` : "Abaixo do mínimo") : "—",
      alerta: verba ? !verba.ok : false,
    },
  ];

  return (
    <section className="flex flex-col gap-5 border-b border-line pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] text-subtle">Raio-X da clínica · onboarding concluído</span>
          <span className="text-[20px] font-medium tracking-[-0.01em] text-text">
            {texto(v.clinica) || texto(v.aluno) || "Clínica"}
          </span>
          <span className="text-[13.5px] text-muted">
            {[
              texto(v.aluno),
              /^\d{4}-\d{2}-\d{2}$/.test(data) ? `diagnóstico em ${formatDate(data)}` : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
        <Link href={`${href}?ver=raio-x`} prefetch={false} className="link text-sm">
          Ver raio-X completo
        </Link>
      </div>

      {texto(v.sucesso) && (
        <blockquote className="border-l-2 border-gold pl-4">
          <p className="text-[13px] text-subtle">Daqui a 90 dias, valeu a pena se...</p>
          <p className="mt-1 font-serif text-[19px] leading-snug text-text">“{texto(v.sucesso)}”</p>
        </blockquote>
      )}

      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        {destaques.map((d) => (
          <Metric key={d.rotulo} rotulo={d.rotulo} tom={d.alerta ? "warn" : undefined}>
            <span className="text-[17px]">{d.valor}</span>
          </Metric>
        ))}
      </div>

      {pts.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[14.5px] font-medium text-text">O que apareceu no diagnóstico</p>
          <ol className="flex flex-col gap-1.5">
            {pts.slice(0, 4).map((pt, i) => (
              <li key={i} className="flex gap-3 text-sm text-text-2">
                <span className="w-4 shrink-0 text-right tabular-nums text-warn">{i + 1}.</span>
                <span>{pt}</span>
              </li>
            ))}
          </ol>
          {pts.length > 4 && (
            <p className="text-[13px] text-subtle">+{pts.length - 4} no raio-X completo</p>
          )}
        </div>
      )}
    </section>
  );
}
