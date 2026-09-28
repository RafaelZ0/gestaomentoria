import {
  STEPS,
  type CampoOnboarding,
  type OnboardingPrecisao,
  type OnboardingValores,
} from "@/lib/onboarding";

// Lê o mesmo formato que resumoTexto() gera ("- Pergunta: Resposta"), seja
// exportado pelo sistema ou digitado à mão seguindo o modelo. As seções
// "Funil" e "O que apareceu no diagnóstico" são ignoradas: são sempre
// recalculadas a partir das respostas.

export interface ResultadoImportacao {
  respostas: OnboardingValores;
  precisao: OnboardingPrecisao;
  reconhecidos: string[];
  totalCampos: number;
}

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// "26.000" → 26000; "2.999,90" → 2999.9; "R$ 1.200" → 1200
function numeroBR(s: string): number | null {
  const limpo = s.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  if (limpo === "") return null;
  const n = Number(limpo);
  return isNaN(n) ? null : n;
}

function valorDoCampo(f: CampoOnboarding, bruto: string): unknown {
  if (f.t === "multi") {
    const opcoes = f.o ?? [];
    return bruto
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map((x) => opcoes.find((o) => normalizar(o) === normalizar(x)) ?? x);
  }
  if (f.t === "origem") {
    const obj: Record<string, string> = {};
    for (const parte of bruto.split(",")) {
      const m = parte.trim().match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*%$/);
      if (m) obj[m[1].trim()] = m[2].replace(",", ".");
    }
    return Object.keys(obj).length ? obj : undefined;
  }
  if (f.t === "range") {
    const n = numeroBR(bruto.replace("%", ""));
    return n == null ? undefined : Math.max(0, Math.min(100, n));
  }
  if (f.t === "number" || f.t === "money") {
    return numeroBR(bruto) ?? undefined;
  }
  if (f.t === "pills") {
    return (f.o ?? []).find((o) => normalizar(o) === normalizar(bruto)) ?? bruto;
  }
  return bruto;
}

export function parseMarkdownDiagnostico(textoMd: string): ResultadoImportacao {
  const campos = new Map<string, CampoOnboarding>();
  for (const s of STEPS) for (const f of s.fields) campos.set(normalizar(f.q), f);

  const respostas: OnboardingValores = {};
  const precisao: OnboardingPrecisao = {};
  const reconhecidos: string[] = [];

  // Resposta de texto longo que quebrou em várias linhas: as linhas seguintes
  // (que não são item, título nem lista numerada) continuam a mesma resposta.
  let textareaAberto: string | null = null;

  for (const linhaBruta of textoMd.split(/\r?\n/)) {
    const linha = linhaBruta.trim();
    if (!/^[-*]\s/.test(linha)) {
      if (linha.startsWith("#") || /^\d+\.\s/.test(linha)) {
        textareaAberto = null;
      } else if (linha && textareaAberto) {
        respostas[textareaAberto] = `${String(respostas[textareaAberto] ?? "")}\n${linha}`;
      }
      continue;
    }
    textareaAberto = null;
    const conteudo = linha.replace(/^[-*]\s+/, "");
    const sep = conteudo.indexOf(": ");
    if (sep === -1) continue;

    const f = campos.get(normalizar(conteudo.slice(0, sep)));
    if (!f) continue;

    let bruto = conteudo.slice(sep + 2).trim();
    if (bruto === "" || bruto === "—" || bruto === "-") continue;

    if (f.prec) {
      if (normalizar(bruto) === "nao sabe") {
        precisao[f.k] = "naosei";
        reconhecidos.push(f.k);
        continue;
      }
      const m = bruto.match(/^(.*?)\s*\((aproximado|exato)\)$/i);
      if (m) {
        precisao[f.k] = m[2].toLowerCase() === "aproximado" ? "aprox" : "exato";
        bruto = m[1].trim();
      }
    }

    const valor = valorDoCampo(f, bruto);
    if (valor === undefined) continue;
    respostas[f.k] = valor;
    reconhecidos.push(f.k);
    if (f.t === "textarea") textareaAberto = f.k;
  }

  // Cabeçalho "# Diagnóstico · Clínica (Dentista)" como reserva, se as
  // linhas de nome não vieram no corpo.
  const titulo = textoMd.match(/^#\s*Diagn[oó]stico\s*·\s*(.*?)\s*\((.*)\)\s*$/m);
  if (titulo) {
    if (!respostas.clinica && titulo[1]) respostas.clinica = titulo[1];
    if (!respostas.aluno && titulo[2]) respostas.aluno = titulo[2];
  }

  const totalCampos = STEPS.reduce((acc, s) => acc + s.fields.length, 0);
  return { respostas, precisao, reconhecidos, totalCampos };
}
