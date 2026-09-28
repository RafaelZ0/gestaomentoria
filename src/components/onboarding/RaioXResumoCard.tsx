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
      <Link
        href={href}
        prefetch={false}
        className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-accent/50 bg-status-accent-bg px-6 py-5 hover:border-accent"
      >
        <div>
          <p className="font-display text-lg font-semibold text-text-primary">
            Diagnóstico de onboarding ainda não feito
          </p>
          <p className="mt-0.5 text-sm text-text-secondary">
            A primeira reunião de toda mentoria é o diagnóstico da clínica. O raio-X fica aqui no
            cadastro do grupo.
          </p>
        </div>
        <span className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white group-hover:bg-accent-hover">
          Fazer diagnóstico
        </span>
      </Link>
    );
  }

  const v = onboarding.respostas as OnboardingValores;
  const p = onboarding.precisao as OnboardingPrecisao;

  if (onboarding.status !== "concluido") {
    const campos = STEPS.flatMap((s) => s.fields);
    const progresso = campos.filter((f) => isFilled(v, p, f)).length / campos.length;
    return (
      <Link
        href={href}
        prefetch={false}
        className="block rounded-2xl border border-status-warn-text/30 bg-bg-surface px-6 py-5 hover:bg-bg-surface-hover"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="rounded-full bg-status-warn-bg px-3 py-1 text-xs font-semibold text-status-warn-text">
              Diagnóstico em andamento
            </span>
            <p className="mt-2 font-display text-lg font-semibold text-text-primary">
              Raio-X da clínica ainda não concluído
            </p>
          </div>
          <span className="text-sm font-medium text-accent">Continuar diagnóstico →</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-bg-surface-hover">
          <div className="h-full rounded-full bg-status-warn-text" style={{ width: `${Math.round(progresso * 100)}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-text-secondary">{Math.round(progresso * 100)}% das perguntas respondidas</p>
      </Link>
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
    <section className="card-hero overflow-hidden rounded-2xl border border-border bg-bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-status-accent-bg to-transparent px-6 py-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Raio-X da clínica</p>
            <span className="rounded-full bg-status-ok-bg px-2.5 py-0.5 text-xs font-semibold text-status-ok-text">
              Onboarding concluído
            </span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold tracking-tight text-text-primary">
            {texto(v.clinica) || texto(v.aluno) || "Clínica"}
          </p>
          <p className="text-sm text-text-secondary">
            {[
              texto(v.aluno),
              /^\d{4}-\d{2}-\d{2}$/.test(data) ? `diagnóstico em ${formatDate(data)}` : "",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <Link
          href={`${href}?ver=raio-x`}
          prefetch={false}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Ver raio-X completo
        </Link>
      </div>

      <div className="space-y-5 px-6 py-5">
        {texto(v.sucesso) && (
          <blockquote className="border-l-4 border-accent pl-4">
            <p className="text-xs text-text-secondary">Daqui a 90 dias, valeu a pena se...</p>
            <p className="mt-1 font-display text-xl leading-snug text-text-primary">“{texto(v.sucesso)}”</p>
          </blockquote>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {destaques.map((d) => (
            <div key={d.rotulo} className="rounded-xl border border-border bg-bg-base p-4">
              <p className="text-xs text-text-secondary">{d.rotulo}</p>
              <p
                className={`mt-1 font-display text-lg font-semibold ${
                  d.alerta ? "text-status-warn-text" : "text-text-primary"
                }`}
              >
                {d.valor}
              </p>
            </div>
          ))}
        </div>

        {pts.length > 0 && (
          <div>
            <p className="text-sm font-medium text-text-primary">O que apareceu no diagnóstico</p>
            <ol className="mt-2 space-y-1.5">
              {pts.slice(0, 4).map((pt, i) => (
                <li key={i} className="flex gap-3 text-sm text-text-secondary">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-status-warn-bg text-[11px] font-bold text-status-warn-text">
                    {i + 1}
                  </span>
                  <span>{pt}</span>
                </li>
              ))}
            </ol>
            {pts.length > 4 && (
              <p className="mt-1.5 text-xs text-text-tertiary">+{pts.length - 4} no raio-X completo</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
