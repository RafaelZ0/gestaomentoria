import { formatDate } from "@/lib/format";
import {
  brl,
  funnel,
  num,
  pontos,
  texto,
  verbaStatus,
  type OnboardingPrecisao,
  type OnboardingValores,
} from "@/lib/onboarding";
import { FunilOnboarding } from "@/components/onboarding/FunilOnboarding";

const CORES_ORIGEM: Record<string, string> = {
  Indicação: "var(--gold)",
  Convênio: "var(--info)",
  Instagram: "var(--paused)",
  Anúncio: "var(--ok)",
  Outros: "var(--off)",
};

function Caixa({
  titulo,
  children,
  larga = false,
}: {
  titulo: string;
  children: React.ReactNode;
  larga?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-surface p-6 ${larga ? "md:col-span-2" : ""}`}
    >
      <h2 className="font-display text-lg font-semibold text-text">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Lista({ itens }: { itens: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-base">
      {itens.map(([rotulo, valor]) => (
        <div key={rotulo} className="contents">
          <dt className="text-text-2">{rotulo}</dt>
          <dd className="font-medium text-text">{valor || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function minusculo(v: unknown): string {
  return texto(v).toLowerCase();
}

export function OnboardingXray({
  respostas: v,
  precisao: p,
  acoes,
}: {
  respostas: OnboardingValores;
  precisao: OnboardingPrecisao;
  acoes?: React.ReactNode;
}) {
  const F = funnel(v, p);
  const pts = pontos(v, p);
  const verba = verbaStatus(v);
  const precisoes = Object.values(p);
  const contar = (t: string) => precisoes.filter((x) => x === t).length;
  const origem = (v.origem as Record<string, unknown>) || {};
  const origens = Object.entries(origem).filter(([, x]) => num(x));
  const totalOrigem = origens.reduce((acc, [, x]) => acc + (num(x) ?? 0), 0);
  const equipamentos = Array.isArray(v.equipamentos) ? (v.equipamentos as string[]) : [];
  const dataReuniao = texto(v.data);

  const juntar = (...partes: string[]) => partes.filter(Boolean).join(" · ");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-gold">Raio-X da clínica</p>
          <h1 className="mt-1 font-serif text-4xl font-medium tracking-[-0.015em] text-text sm:text-5xl">
            {texto(v.clinica) || texto(v.aluno) || "Clínica"}
          </h1>
          <p className="mt-2 text-base text-text-2">
            {juntar(
              texto(v.aluno),
              /^\d{4}-\d{2}-\d{2}$/.test(dataReuniao) ? `onboarding em ${formatDate(dataReuniao)}` : ""
            )}
          </p>
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </div>

      {texto(v.sucesso) && (
        <section className="rounded-2xl border-l-4 border-gold bg-surface p-7">
          <p className="text-sm font-medium text-text-2">Daqui a 90 dias, valeu a pena se...</p>
          <p className="mt-2 font-serif text-2xl leading-snug text-text sm:text-3xl">
            “{texto(v.sucesso)}”
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Caixa titulo="A clínica">
          <Lista
            itens={[
              ["Existe há", v.anos ? `${texto(v.anos)} anos` : ""],
              ["Unidades", juntar(texto(v.unidades), minusculo(v.imovel))],
              ["Cadeiras", juntar(texto(v.cadeiras), minusculo(v.ocupacao))],
              ["Sala de cirurgia", texto(v.salaCirurgia)],
              ["Laboratório", texto(v.laboratorio)],
              ["Equipamentos", equipamentos.join(", ")],
              [
                "Controle",
                `${texto(v.sistema)}${texto(v.sistemaNome) ? ` (${texto(v.sistemaNome)})` : ""}`,
              ],
              ["Particular", v.particular != null ? `${texto(v.particular)}%` : ""],
            ]}
          />
        </Caixa>

        <Caixa titulo="A equipe">
          <Lista
            itens={[
              [
                "Funcionários",
                juntar(texto(v.funcionarios), num(v.clt) != null ? `${texto(v.clt)} CLT` : ""),
              ],
              [
                "Dentistas",
                juntar(
                  texto(v.dentistas),
                  v.vinculo && v.vinculo !== "Não há outros" ? minusculo(v.vinculo) : ""
                ),
              ],
              ["Implantes", texto(v.quemImplanta)],
              ["Na cadeira", v.diasCadeira ? `${texto(v.diasCadeira)} dias por semana` : ""],
              [
                "Recepção",
                juntar(texto(v.recepcao), v.recepcaoFixa ? `fixa: ${minusculo(v.recepcaoFixa)}` : ""),
              ],
              ["Auxiliares", texto(v.auxiliares)],
              ["Administrativo", texto(v.admin)],
              ["Decisão", texto(v.decisor)],
            ]}
          />
        </Caixa>

        <Caixa titulo="Números de hoje" larga>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                rotulo: "Faturamento mensal",
                valor: p.fat === "naosei" ? "não sabe" : brl(num(v.fat)),
                detalhe: v.fatTipo && v.fatTipo !== "Não sabe dizer" ? minusculo(v.fatTipo) : "",
              },
              {
                rotulo: "Implante e prótese",
                valor: v.pctImplante != null ? `${texto(v.pctImplante)}%` : "—",
                detalhe: "do faturamento",
              },
              {
                rotulo: "Valor médio do implante",
                valor: p.ticket === "naosei" ? "não sabe" : brl(num(v.ticket)),
                detalhe: "",
              },
              {
                rotulo: "Precisão dos números",
                valor: `${contar("exato")} · ${contar("aprox")} · ${contar("naosei")}`,
                detalhe: "exatos · aproximados · não sabe",
              },
            ].map((s) => (
              <div key={s.rotulo} className="rounded-xl border border-line bg-bg p-4">
                <p className="text-sm text-text-2">{s.rotulo}</p>
                <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-text">
                  {s.valor}
                </p>
                {s.detalhe && <p className="mt-0.5 text-xs text-muted">{s.detalhe}</p>}
              </div>
            ))}
          </div>
        </Caixa>

        <section className="rounded-2xl border border-line bg-surface p-6 md:col-span-2">
          <FunilOnboarding funil={F} subtitulo="Com os números informados no diagnóstico." />
        </section>

        <Caixa titulo="De onde vêm os pacientes">
          {totalOrigem > 0 ? (
            <>
              <div className="flex h-8 overflow-hidden rounded-lg border border-line">
                {origens.map(([k, x]) => (
                  <i
                    key={k}
                    title={`${k} ${texto(x)}%`}
                    className="block h-full"
                    style={{
                      width: `${((num(x) ?? 0) / totalOrigem) * 100}%`,
                      background: CORES_ORIGEM[k] ?? "var(--off)",
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-text">
                {origens.map(([k, x]) => (
                  <span key={k} className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: CORES_ORIGEM[k] ?? "var(--off)" }}
                    />
                    {k} {texto(x)}%
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-text-2">Não informado.</p>
          )}
          <div className="mt-5 space-y-1.5 text-sm text-text-2">
            <p>
              Tráfego pago: <span className="text-text">{texto(v.trafego) || "não informado"}</span>
            </p>
            <p>
              Verba para anúncios:{" "}
              <span className={verba ? (verba.ok ? "text-ok" : "text-warn") : ""}>
                {verba ? verba.txt : "não informada"}
              </span>
            </p>
          </div>
        </Caixa>

        <Caixa titulo="Foco dos 90 dias">
          <p className="font-display text-3xl font-semibold text-text">
            {texto(v.indicador) || "A definir"}
          </p>
          {texto(v.riscos) && (
            <p className="mt-4 text-sm text-text-2">
              O que pode atrapalhar: <span className="text-text">{texto(v.riscos)}</span>
            </p>
          )}
        </Caixa>

        <Caixa titulo="O que apareceu no diagnóstico" larga>
          {pts.length > 0 ? (
            <ol className="divide-y divide-line">
              {pts.map((pt, i) => (
                <li key={pt} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warn/10 font-display text-sm font-bold text-warn">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-base text-text">{pt}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-text-2">Nada se destacou com as respostas preenchidas.</p>
          )}
          <p className="mt-5 text-sm text-text-2">
            {/^\d{4}-\d{2}-\d{2}$/.test(texto(v.proxima))
              ? `Na próxima reunião, em ${formatDate(texto(v.proxima))}, apresentamos como o acompanhamento segue a partir daqui.`
              : "Próxima reunião: a marcar."}
          </p>
        </Caixa>
      </div>
    </div>
  );
}
