"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { STEPS, texto } from "@/lib/onboarding";
import { parseMarkdownDiagnostico, type ResultadoImportacao } from "@/lib/onboardingImport";
import { iniciarOnboarding, importarOnboarding } from "@/app/actions/onboarding";

const inputClass =
  "campo w-full text-lg";

export function OnboardingInicio({
  grupoId,
  alunoSugerido,
  clinicaSugerida,
  responsaveis,
}: {
  grupoId: string;
  alunoSugerido: string;
  clinicaSugerida: string;
  responsaveis: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [aluno, setAluno] = useState(alunoSugerido);
  const [clinica, setClinica] = useState(clinicaSugerida);
  const [hora, setHora] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
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
      const r = await iniciarOnboarding(grupoId, aluno, clinica, { hora, responsavelId });
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
      const r = await importarOnboarding(grupoId, previa.respostas, previa.precisao, {
        hora,
        responsavelId,
      });
      if (!r.ok) {
        setErroImport(r.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="card-hero rounded-2xl border border-line bg-surface p-7">
        <p className="text-sm font-medium uppercase tracking-wider text-gold">Primeira reunião</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Diagnóstico de onboarding
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-text-2">
          Toda mentoria começa por aqui. O diagnóstico vira a reunião de onboarding na aba
          Reuniões e o raio-X da clínica fica guardado no cadastro do grupo.
        </p>
      </div>

      {/* Vale pros dois caminhos: é a reunião que o diagnóstico cria. */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-xl font-semibold text-text">
          Reunião de onboarding
        </h2>
        <p className="mt-1 text-sm text-text-2">
          Com o horário, a reunião já aparece na grade da Agenda. Sem ele, fica na faixa
          &quot;Sem horário&quot; do dia e dá pra definir depois.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-base font-medium text-text">
              Horário <span className="font-normal text-muted">(opcional)</span>
            </span>
            <input
              type="time"
              step={300}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-base font-medium text-text">Responsável</span>
            <select
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione…</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Passo a passo */}
        <section className="flex flex-col rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-xl font-semibold text-text">Preencher passo a passo</h2>
          <p className="mt-1 text-sm text-text-2">
            Na reunião, com a tela compartilhada. São 8 etapas e o raio-X aparece no final.
          </p>

          <div className="mt-5 space-y-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-base font-medium text-text">Nome do dentista</span>
              <input
                value={aluno}
                onChange={(e) => setAluno(e.target.value)}
                autoComplete="off"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-base font-medium text-text">Nome da clínica</span>
              <input
                value={clinica}
                onChange={(e) => setClinica(e.target.value)}
                autoComplete="off"
                className={inputClass}
              />
            </label>
          </div>

          {erroManual && <p className="mt-3 text-sm text-danger">{erroManual}</p>}

          <div className="mt-auto pt-6">
            <button
              type="button"
              disabled={iniciando || !aluno.trim()}
              onClick={comecar}
              className="btn-secondary w-full"
            >
              {iniciando ? "Criando…" : "Começar diagnóstico"}
            </button>
          </div>
        </section>

        {/* Importar */}
        <section className="flex flex-col rounded-2xl border border-line bg-surface p-6">
          <h2 className="font-display text-xl font-semibold text-text">Importar de um documento</h2>
          <p className="mt-1 text-sm text-text-2">
            Já tem as respostas prontas? Suba o arquivo <code className="text-text">.md</code> no
            modelo do resumo (o mesmo do botão &quot;Baixar resumo&quot;) ou cole o texto abaixo.
          </p>

          <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-bg px-4 py-4 text-sm text-text-2 hover:border-gold hover:text-text">
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
            className="campo mt-3 w-full font-mono text-xs placeholder:text-muted"
          />

          {previa && previa.reconhecidos.length > 0 && (
            <div className="mt-4 rounded-xl border border-line bg-bg p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-base font-medium text-text">
                  {texto(previa.respostas.clinica) || texto(previa.respostas.aluno) || "Sem nome"}
                </p>
                <p className="font-display text-lg font-semibold tabular-nums text-ok">
                  {previa.reconhecidos.length} de {previa.totalCampos}
                </p>
              </div>
              <p className="text-xs text-text-2">respostas reconhecidas no documento</p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {STEPS.map((s) => {
                  const n = s.fields.filter((f) => previa.reconhecidos.includes(f.k)).length;
                  return (
                    <li key={s.id} className="flex justify-between gap-2 text-text-2">
                      <span>{s.nome}</span>
                      <span
                        className={`tabular-nums ${
                          n === s.fields.length ? "text-ok" : "text-text"
                        }`}
                      >
                        {n}/{s.fields.length}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-muted">
                Fica como rascunho: dá pra revisar e completar pelo passo a passo antes de ver o raio-X.
              </p>
            </div>
          )}

          {erroImport && <p className="mt-3 text-sm text-danger">{erroImport}</p>}

          <div className="mt-auto pt-6">
            <button
              type="button"
              disabled={importando || !previa || previa.reconhecidos.length === 0}
              onClick={importar}
              className="btn-secondary w-full"
            >
              {importando ? "Importando…" : "Importar e revisar"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
