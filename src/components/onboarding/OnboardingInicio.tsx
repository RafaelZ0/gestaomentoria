"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { STEPS, texto } from "@/lib/onboarding";
import { parseMarkdownDiagnostico, type ResultadoImportacao } from "@/lib/onboardingImport";
import { iniciarOnboarding, importarOnboarding } from "@/app/actions/onboarding";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-base px-4 py-3 text-lg text-text-primary outline-none focus:border-accent";

export function OnboardingInicio({
  grupoId,
  alunoSugerido,
  clinicaSugerida,
}: {
  grupoId: string;
  alunoSugerido: string;
  clinicaSugerida: string;
}) {
  const router = useRouter();
  const [aluno, setAluno] = useState(alunoSugerido);
  const [clinica, setClinica] = useState(clinicaSugerida);
  const [erroManual, setErroManual] = useState<string | null>(null);
  const [iniciando, startIniciar] = useTransition();

  const [textoImport, setTextoImport] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [previa, setPrevia] = useState<ResultadoImportacao | null>(null);
  const [erroImport, setErroImport] = useState<string | null>(null);
  const [importando, startImportar] = useTransition();

  function analisar(conteudo: string) {
    setTextoImport(conteudo);
    setErroImport(null);
    if (!conteudo.trim()) {
      setPrevia(null);
      return;
    }
    const r = parseMarkdownDiagnostico(conteudo);
    setPrevia(r);
    if (r.reconhecidos.length === 0) {
      setErroImport(
        'Não reconheci nenhuma resposta. O documento precisa seguir o modelo "- Pergunta: Resposta" do resumo do diagnóstico.'
      );
    }
  }

  async function lerArquivo(arquivo: File | undefined) {
    if (!arquivo) return;
    setNomeArquivo(arquivo.name);
    analisar(await arquivo.text());
  }

  function comecar() {
    setErroManual(null);
    startIniciar(async () => {
      const r = await iniciarOnboarding(grupoId, aluno, clinica);
      if (!r.ok) {
        setErroManual(r.error);
        return;
      }
      router.refresh();
    });
  }

  function importar() {
    if (!previa) return;
    setErroImport(null);
    startImportar(async () => {
      const r = await importarOnboarding(grupoId, previa.respostas, previa.precisao);
      if (!r.ok) {
        setErroImport(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="card-hero rounded-2xl border border-border bg-bg-surface p-7">
        <p className="text-sm font-medium uppercase tracking-wider text-accent">Primeira reunião</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Diagnóstico de onboarding
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-text-secondary">
          Toda mentoria começa por aqui. O diagnóstico vira a reunião de onboarding na aba
          Reuniões e o raio-X da clínica fica guardado no cadastro do grupo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Passo a passo */}
        <section className="flex flex-col rounded-2xl border border-border bg-bg-surface p-6">
          <h2 className="font-display text-xl font-semibold text-text-primary">Preencher passo a passo</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Na reunião, com a tela compartilhada. São 8 etapas e o raio-X aparece no final.
          </p>

          <div className="mt-5 space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-base font-medium text-text-primary">Nome do dentista</span>
              <input
                value={aluno}
                onChange={(e) => setAluno(e.target.value)}
                autoComplete="off"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-base font-medium text-text-primary">Nome da clínica</span>
              <input
                value={clinica}
                onChange={(e) => setClinica(e.target.value)}
                autoComplete="off"
                className={inputClass}
              />
            </label>
          </div>

          {erroManual && <p className="mt-3 text-sm text-status-alert-text">{erroManual}</p>}

          <div className="mt-auto pt-6">
            <button
              type="button"
              disabled={iniciando || !aluno.trim()}
              onClick={comecar}
              className="w-full rounded-lg bg-accent px-5 py-3 text-base font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {iniciando ? "Criando…" : "Começar diagnóstico"}
            </button>
          </div>
        </section>

        {/* Importar */}
        <section className="flex flex-col rounded-2xl border border-border bg-bg-surface p-6">
          <h2 className="font-display text-xl font-semibold text-text-primary">Importar de um documento</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Já tem as respostas prontas? Suba o arquivo <code className="text-text-primary">.md</code> no
            modelo do resumo (o mesmo do botão &quot;Baixar resumo&quot;) ou cole o texto abaixo.
          </p>

          <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-bg-base px-4 py-4 text-sm text-text-secondary hover:border-accent hover:text-text-primary">
            <input
              type="file"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              className="sr-only"
              onChange={(e) => void lerArquivo(e.target.files?.[0])}
            />
            {nomeArquivo ? `Arquivo: ${nomeArquivo}` : "Escolher arquivo .md"}
          </label>

          <textarea
            value={textoImport}
            onChange={(e) => {
              setNomeArquivo(null);
              analisar(e.target.value);
            }}
            rows={6}
            placeholder={"# Diagnóstico · Clínica (Dentista)\n\n## Vamos começar pelo básico\n- Nome do dentista: ...\n- Nome da clínica: ..."}
            className="mt-3 w-full rounded-lg border border-border bg-bg-base px-4 py-3 font-mono text-xs text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent"
          />

          {previa && previa.reconhecidos.length > 0 && (
            <div className="mt-4 rounded-xl border border-border bg-bg-base p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-base font-medium text-text-primary">
                  {texto(previa.respostas.clinica) || texto(previa.respostas.aluno) || "Sem nome"}
                </p>
                <p className="font-display text-lg font-semibold tabular-nums text-status-ok-text">
                  {previa.reconhecidos.length} de {previa.totalCampos}
                </p>
              </div>
              <p className="text-xs text-text-secondary">respostas reconhecidas no documento</p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {STEPS.map((s) => {
                  const n = s.fields.filter((f) => previa.reconhecidos.includes(f.k)).length;
                  return (
                    <li key={s.id} className="flex justify-between gap-2 text-text-secondary">
                      <span>{s.nome}</span>
                      <span
                        className={`tabular-nums ${
                          n === s.fields.length ? "text-status-ok-text" : "text-text-primary"
                        }`}
                      >
                        {n}/{s.fields.length}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-text-tertiary">
                Fica como rascunho: dá pra revisar e completar pelo passo a passo antes de ver o raio-X.
              </p>
            </div>
          )}

          {erroImport && <p className="mt-3 text-sm text-status-alert-text">{erroImport}</p>}

          <div className="mt-auto pt-6">
            <button
              type="button"
              disabled={importando || !previa || previa.reconhecidos.length === 0}
              onClick={importar}
              className="w-full rounded-lg bg-accent px-5 py-3 text-base font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {importando ? "Importando…" : "Importar e revisar"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
