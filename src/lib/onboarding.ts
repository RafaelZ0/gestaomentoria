// Porta 1:1 do docs/referencia/diagnostico-psi.html: etapas, textos,
// cálculo do funil, verba mínima, pontos do raio-X e resumo em Markdown.
// Taxas do funil e pontos NÃO são salvos — sempre recalculados a partir
// de `respostas` (objeto `v` do HTML) e `precisao` (objeto `p`).

export type TipoCampo =
  | "text"
  | "textarea"
  | "date"
  | "number"
  | "money"
  | "range"
  | "pills"
  | "multi"
  | "origem";

export type Precisao = "exato" | "aprox" | "naosei";

export type OnboardingValores = Record<string, unknown>;
export type OnboardingPrecisao = Record<string, string>;

export interface CampoOnboarding {
  k: string;
  t: TipoCampo;
  q: string;
  hint?: string;
  suf?: string;
  o?: string[];
  wide?: boolean;
  prec?: boolean;
}

export interface EtapaOnboarding {
  id: string;
  nome: string;
  titulo: string;
  lead: string;
  roteiro: string[];
  fields: CampoOnboarding[];
}

export const ORIGENS = ["Indicação", "Convênio", "Instagram", "Anúncio", "Outros"];

export const STEPS: EtapaOnboarding[] = [
  {
    id: "abertura",
    nome: "Abertura",
    titulo: "Vamos começar pelo básico",
    lead: "Quem está na reunião e qual clínica estamos olhando.",
    roteiro: [
      "<em>Essa reunião é só para eu entender a sua clínica. Vou perguntar bastante coisa, inclusive números. No final a gente vê juntos um raio-X do que apareceu, e na próxima reunião eu te explico como o acompanhamento segue a partir daqui.</em>",
      "<em>Se não souber um número, me dá o aproximado. Se não souber de jeito nenhum, tudo bem: isso também é informação.</em>",
      "Peça permissão para gravar antes de começar.",
    ],
    fields: [
      { k: "aluno", t: "text", q: "Nome do dentista" },
      { k: "clinica", t: "text", q: "Nome da clínica" },
      { k: "data", t: "date", q: "Data da reunião" },
      { k: "participantes", t: "text", q: "Quem mais está na reunião", hint: "Sócio, cônjuge, gerente..." },
      { k: "gravacao", t: "pills", q: "Autorizou gravar a reunião?", o: ["Sim", "Não"] },
    ],
  },
  {
    id: "historia",
    nome: "História",
    titulo: "A história da clínica",
    lead: "De onde a clínica veio e por que decidir agora.",
    roteiro: [
      'A resposta de "valeu a pena se..." deve ser anotada com as palavras exatas dele. Ela volta na revisão do mês 3.',
    ],
    fields: [
      { k: "anos", t: "number", q: "Há quantos anos a clínica existe?", suf: "anos" },
      { k: "historia", t: "textarea", q: "Como a clínica chegou onde está hoje", wide: true },
      { k: "porque", t: "textarea", q: "Por que decidiu entrar agora, e não daqui a seis meses?", wide: true },
      { k: "sucesso", t: "textarea", q: "Daqui a 90 dias, você vai dizer que valeu a pena se...", hint: "Nas palavras dele.", wide: true },
    ],
  },
  {
    id: "estrutura",
    nome: "Estrutura",
    titulo: "A estrutura da clínica",
    lead: "Espaço físico, equipamentos e como a clínica funciona no dia a dia.",
    roteiro: ["Aqui é levantamento de fato: não precisa aprofundar, só registrar como está hoje."],
    fields: [
      { k: "unidades", t: "number", q: "Quantas unidades (endereços) a clínica tem?" },
      { k: "imovel", t: "pills", q: "O imóvel é...", o: ["Próprio", "Alugado", "Dividido com outra clínica"] },
      { k: "cadeiras", t: "number", q: "Quantas cadeiras?" },
      { k: "ocupacao", t: "pills", q: "Como as cadeiras ficam ao longo da semana?", o: ["Quase sempre livres", "Metade do tempo ocupadas", "Quase sempre cheias"] },
      { k: "salaCirurgia", t: "pills", q: "Tem sala de cirurgia separada?", o: ["Sim", "Não"] },
      { k: "laboratorio", t: "pills", q: "Laboratório de prótese", o: ["Próprio", "Terceirizado", "Os dois"] },
      { k: "equipamentos", t: "multi", q: "Equipamentos que a clínica tem", o: ["Raio-X periapical", "Panorâmico", "Tomógrafo", "Scanner intraoral", "Impressora 3D", "Fresadora", "Nenhum destes"], wide: true },
      { k: "sistema", t: "pills", q: "Como a agenda e os pacientes são controlados?", o: ["Sistema de gestão", "Planilha", "Agenda de papel", "Não há controle"], wide: true },
      { k: "sistemaNome", t: "text", q: "Se usa sistema, qual?" },
      { k: "horario", t: "text", q: "Horário de funcionamento" },
      { k: "sabado", t: "pills", q: "Atende sábado?", o: ["Sim", "Não", "Às vezes"] },
      { k: "particular", t: "range", q: "Proporção de pacientes particulares", hint: "O restante é convênio." },
      { k: "procedimentos", t: "text", q: "Procedimentos que mais faz hoje" },
      { k: "querMais", t: "text", q: "Procedimentos que gostaria de fazer mais" },
      { k: "regiao", t: "text", q: "Cidade e região de onde vêm os pacientes", wide: true },
    ],
  },
  {
    id: "equipe",
    nome: "Equipe",
    titulo: "Quem trabalha na clínica",
    lead: "O tamanho da equipe e quem faz o quê.",
    roteiro: [
      "Se não houver ninguém fixo na recepção ou ninguém responsável pelo administrativo, anote. São dos pontos que mais pesam quando a clínica passa a receber mais pacientes.",
    ],
    fields: [
      { k: "funcionarios", t: "number", q: "Quantos funcionários no total?", hint: "Sem contar os dentistas." },
      { k: "clt", t: "number", q: "Quantos são registrados (CLT)?" },
      { k: "dentistas", t: "number", q: "Quantos dentistas atendem, contando você?" },
      { k: "vinculo", t: "pills", q: "Os outros dentistas são...", o: ["Não há outros", "Sócios", "Contratados fixos", "Autônomos por porcentagem", "Misto"] },
      { k: "especialidades", t: "text", q: "Especialidades atendidas na clínica", wide: true },
      { k: "quemImplanta", t: "pills", q: "Quem faz os implantes?", o: ["Só eu", "Eu e outro dentista", "Outro dentista"] },
      { k: "diasCadeira", t: "number", q: "Quantos dias por semana você atende na cadeira?", suf: "dias" },
      { k: "recepcao", t: "number", q: "Quantas pessoas na recepção?" },
      { k: "recepcaoFixa", t: "pills", q: "Tem alguém fixo na recepção o dia todo?", o: ["Sim", "Não", "Às vezes"] },
      { k: "auxiliares", t: "number", q: "Quantas auxiliares (ASB/TSB)?" },
      { k: "admin", t: "pills", q: "Quem cuida do administrativo e financeiro?", o: ["Eu mesmo", "Gerente ou administrativo", "Cônjuge ou familiar", "Contador externo", "Ninguém definido"] },
      { k: "decisor", t: "pills", q: "Quem decide as questões da clínica?", o: ["Só eu", "Eu e um sócio", "Eu e o cônjuge", "Outro arranjo"] },
    ],
  },
  {
    id: "numeros",
    nome: "Números",
    titulo: "Os números de hoje",
    lead: "Não é avaliação. É o ponto de partida, para daqui a 90 dias colocar o antes e o depois lado a lado.",
    roteiro: [
      '<em>Esses números não são para te avaliar. Sem o "antes", não tem como medir o "depois".</em>',
      "Marque ao lado de cada número se é exato, aproximado ou se ele não sabe.",
    ],
    fields: [
      { k: "fat", t: "money", q: "Faturamento médio mensal (últimos 3 meses)", prec: true },
      { k: "fatTipo", t: "pills", q: "Esse faturamento é...", o: ["Vendido no mês", "Recebido no mês", "Não sabe dizer"] },
      { k: "pctImplante", t: "range", q: "Quanto do faturamento vem de implante e prótese?" },
      { k: "ticket", t: "money", q: "Valor médio de um tratamento de implante", prec: true },
      { k: "contatos", t: "number", q: "Contatos novos por mês", hint: "WhatsApp, telefone e Instagram somados.", prec: true },
      { k: "agendados", t: "number", q: "Avaliações agendadas por mês", prec: true },
      { k: "compareceram", t: "number", q: "Avaliações realizadas por mês", hint: "Quantos de fato vieram.", prec: true },
      { k: "fecharam", t: "number", q: "Tratamentos fechados por mês", prec: true },
      { k: "origem", t: "origem", q: "De onde vêm os pacientes novos (proporção aproximada)", wide: true },
      { k: "registro", t: "pills", q: "Onde esses números ficam registrados?", o: ["Sistema", "Planilha", "Caderno", "Não registra"], wide: true },
    ],
  },
  {
    id: "comercial",
    nome: "Atendimento",
    titulo: "Do primeiro contato ao fechamento",
    lead: "O caminho que o paciente percorre dentro da clínica.",
    roteiro: [
      "Se não existe retorno para orçamento parado, pergunte quantos ele estima que existam. É a oportunidade mais barata da clínica.",
    ],
    fields: [
      { k: "quemResponde", t: "text", q: "Quem responde o paciente novo?" },
      { k: "tempoResp", t: "pills", q: "Em quanto tempo, em média?", o: ["Até 15 min", "Até 1 hora", "Algumas horas", "No dia seguinte ou mais"] },
      { k: "preco", t: "pills", q: "O que a recepção faz quando perguntam o preço?", o: ["Passa o valor", "Não passa, convida para avaliação", "Depende de quem atende"] },
      { k: "avaliacao", t: "pills", q: "A avaliação é...", o: ["Gratuita", "Paga"] },
      { k: "orcamento", t: "pills", q: "Como o orçamento é apresentado?", o: ["Na hora, pelo dentista", "Depois, pela recepção", "Por WhatsApp", "Varia"] },
      { k: "followup", t: "pills", q: "Alguém volta a falar com quem não fechou?", o: ["Sim, sempre", "Às vezes", "Não"] },
      { k: "parados", t: "number", q: "Quantos orçamentos parados você estima ter hoje?" },
      { k: "confirma", t: "pills", q: "Confirma as consultas na véspera?", o: ["Sim", "Às vezes", "Não"] },
      { k: "pagamento", t: "multi", q: "Formas de pagamento oferecidas", o: ["Pix", "Cartão", "Boleto próprio", "Financeira", "Dinheiro"], wide: true },
    ],
  },
  {
    id: "divulgacao",
    nome: "Divulgação",
    titulo: "Como a clínica aparece",
    lead: "O que já foi tentado para atrair pacientes.",
    roteiro: [
      "Nesta reunião não entramos em implantação. Só registrar o histórico e a disponibilidade de verba.",
      "Deixe claro que a verba de anúncio é separada do valor do acompanhamento: ela vai direto para a plataforma.",
    ],
    fields: [
      { k: "trafego", t: "pills", q: "Você já fez tráfego pago (anúncio no Instagram ou Google)?", o: ["Nunca", "Já fiz por conta própria", "Já fiz com agência ou gestor", "Faço hoje"] },
      { k: "trafegoComo", t: "textarea", q: "Como foi essa experiência?", wide: true },
      { k: "verbaDisp", t: "pills", q: "Hoje você teria verba disponível para investir em anúncios?", o: ["Sim", "Não no momento", "Ainda não sei"] },
      { k: "verba", t: "money", q: "Quanto teria disponível por mês?", hint: "O mínimo para iniciar o tráfego é R$ 1.200 por mês, pago direto à plataforma de anúncios." },
      { k: "instagram", t: "pills", q: "Quem cuida do Instagram da clínica?", o: ["Eu mesmo", "Alguém da equipe", "Agência ou social media", "Ninguém"] },
      { k: "consultoria", t: "pills", q: "Já contratou consultoria ou mentoria antes?", o: ["Não", "Sim, foi bom", "Sim, não foi bom"] },
    ],
  },
  {
    id: "objetivo",
    nome: "Objetivo",
    titulo: "O que precisa mudar",
    lead: "O foco dos próximos 90 dias e o que pode atrapalhar.",
    roteiro: [
      "<em>Não é promessa de resultado. É o que vamos acompanhar juntos para saber se estamos no caminho.</em>",
      "Encerre marcando a próxima reunião, onde você explica como o acompanhamento segue.",
    ],
    fields: [
      { k: "indicador", t: "pills", q: "Dos números que vimos, qual mais importa melhorar?", o: ["Mais contatos", "Mais agendamentos", "Mais comparecimento", "Mais fechamentos", "Ticket maior", "Ainda não sei"], wide: true },
      { k: "riscos", t: "textarea", q: "O que pode atrapalhar nos próximos meses?", hint: "Tempo, equipe, férias, reforma, troca de recepção...", wide: true },
      { k: "canal", t: "text", q: "Melhor canal e horário para falar com você" },
      { k: "proxima", t: "date", q: "Data da próxima reunião" },
    ],
  },
];

export const VERBA_MIN = 1200;

export function num(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export function brl(v: number | null): string {
  return v == null ? "—" : "R$ " + Math.round(v).toLocaleString("pt-BR");
}

export function pct(v: number | null): string {
  return v == null ? "—" : Math.round(v * 100) + "%";
}

export function texto(v: unknown): string {
  return v == null ? "" : String(v);
}

export function isFilled(
  v: OnboardingValores,
  p: OnboardingPrecisao,
  f: CampoOnboarding
): boolean {
  const val = v[f.k];
  if (f.prec && p[f.k] === "naosei") return true;
  if (f.k === "verba" && (v.verbaDisp === "Não no momento" || v.verbaDisp === "Ainda não sei")) {
    return true;
  }
  if (f.t === "multi") return Array.isArray(val) && val.length > 0;
  if (f.t === "origem") {
    return (
      !!val &&
      Object.values(val as Record<string, unknown>).some((x) => {
        const n = num(x);
        return n != null && n > 0;
      })
    );
  }
  return val !== undefined && val !== null && String(val).trim() !== "";
}

export function stepProgress(
  v: OnboardingValores,
  p: OnboardingPrecisao,
  etapa: EtapaOnboarding
): number {
  return etapa.fields.filter((f) => isFilled(v, p, f)).length / etapa.fields.length;
}

export interface TaxaFunil {
  nome: "Agendamento" | "Comparecimento" | "Fechamento";
  de: string;
  para: string;
  v: number | null;
}

export interface Funil {
  c: number | null;
  a: number | null;
  r: number | null;
  f: number | null;
  rates: TaxaFunil[];
  worst: TaxaFunil | null;
  issues: string[];
}

export function funnel(v: OnboardingValores, p: OnboardingPrecisao): Funil {
  const g = (k: string) => (p[k] === "naosei" ? null : num(v[k]));
  const c = g("contatos");
  const a = g("agendados");
  const r = g("compareceram");
  const f = g("fecharam");
  const rates: TaxaFunil[] = [
    { nome: "Agendamento", de: "contato", para: "avaliação agendada", v: c && a != null ? a / c : null },
    { nome: "Comparecimento", de: "agendado", para: "avaliação realizada", v: a && r != null ? r / a : null },
    { nome: "Fechamento", de: "avaliação", para: "tratamento fechado", v: r && f != null ? f / r : null },
  ];
  const valid = rates.filter((x) => x.v != null);
  const worst =
    valid.length >= 2 ? valid.reduce((m, x) => ((x.v as number) < (m.v as number) ? x : m)) : null;
  const issues: string[] = [];
  if (c != null && a != null && a > c) issues.push("agendados maior que contatos");
  if (a != null && r != null && r > a) issues.push("realizadas maior que agendadas");
  if (r != null && f != null && f > r) issues.push("fechamentos maior que avaliações realizadas");
  return { c, a, r, f, rates, worst, issues };
}

export function perdaDoPiorEstagio(F: Funil): number | null {
  if (!F.worst) return null;
  const pares: Record<TaxaFunil["nome"], [number | null, number | null]> = {
    Agendamento: [F.c, F.a],
    Comparecimento: [F.a, F.r],
    Fechamento: [F.r, F.f],
  };
  const [de, para] = pares[F.worst.nome];
  return de != null && para != null ? de - para : null;
}

export interface StatusVerba {
  ok: boolean;
  txt: string;
}

export function verbaStatus(v: OnboardingValores): StatusVerba | null {
  const d = v.verbaDisp;
  const val = num(v.verba);
  if (d === "Não no momento") return { ok: false, txt: "Sem verba disponível para anúncios no momento." };
  if (d === "Ainda não sei") return { ok: false, txt: "Verba para anúncios ainda indefinida." };
  if (val == null) return null;
  if (val < VERBA_MIN) {
    return { ok: false, txt: `${brl(val)} por mês: abaixo do mínimo de ${brl(VERBA_MIN)} para iniciar o tráfego.` };
  }
  return { ok: true, txt: `${brl(val)} por mês: atende o mínimo de ${brl(VERBA_MIN)} para iniciar o tráfego.` };
}

export function pontos(v: OnboardingValores, p: OnboardingPrecisao): string[] {
  const F = funnel(v, p);
  const out: string[] = [];
  if (F.worst) out.push(`Maior perda do funil está no ${F.worst.nome.toLowerCase()} (${pct(F.worst.v)}).`);
  if (v.recepcaoFixa === "Não" || v.recepcaoFixa === "Às vezes") {
    out.push("Não há alguém fixo na recepção durante todo o horário.");
  }
  if (v.admin === "Ninguém definido") out.push("Não há um responsável definido pelo administrativo e financeiro.");
  if (v.sistema === "Agenda de papel" || v.sistema === "Não há controle") {
    out.push("Agenda e pacientes não são controlados em sistema ou planilha.");
  }
  if (v.tempoResp === "Algumas horas" || v.tempoResp === "No dia seguinte ou mais") {
    out.push(`O paciente novo espera ${texto(v.tempoResp).toLowerCase()} pela resposta.`);
  }
  if (v.followup === "Não" || v.followup === "Às vezes") {
    const parados = num(v.parados);
    out.push(`Quem não fecha nem sempre recebe retorno${parados ? ` (cerca de ${parados} orçamentos parados)` : ""}.`);
  }
  if (v.confirma === "Não" || v.confirma === "Às vezes") {
    out.push("As consultas nem sempre são confirmadas na véspera.");
  }
  const naosei = Object.values(p).filter((x) => x === "naosei").length;
  if (v.registro === "Não registra" || naosei >= 2) {
    out.push("Os números da clínica não estão registrados de forma consistente.");
  }
  const vs = verbaStatus(v);
  if (vs && !vs.ok) out.push(vs.txt);
  if (v.fatTipo === "Não sabe dizer") out.push("Não está claro se o faturamento informado é vendido ou recebido.");
  return out;
}

export function resumoTexto(v: OnboardingValores, p: OnboardingPrecisao): string {
  const F = funnel(v, p);
  const L: string[] = [];
  L.push(`# Diagnóstico · ${texto(v.clinica)} (${texto(v.aluno)})`, `Data: ${texto(v.data) || "—"}`, "");
  for (const s of STEPS) {
    L.push(`## ${s.titulo}`);
    for (const f of s.fields) {
      let x: unknown = v[f.k];
      if (f.t === "origem") {
        const o = (x as Record<string, unknown>) || {};
        x = Object.entries(o)
          .filter(([, y]) => num(y))
          .map(([k, y]) => `${k} ${y}%`)
          .join(", ");
      } else if (Array.isArray(x)) {
        x = x.join(", ");
      } else if (f.t === "range" && x != null) {
        x = `${x}%`;
      }
      if (f.prec && p[f.k]) {
        x = p[f.k] === "naosei" ? "não sabe" : `${x ?? ""} (${p[f.k] === "aprox" ? "aproximado" : "exato"})`;
      }
      L.push(`- ${f.q}: ${x == null || x === "" ? "—" : String(x)}`);
    }
    L.push("");
  }
  L.push("## Funil", ...F.rates.map((r) => `- ${r.nome}: ${pct(r.v)}`), "");
  L.push("## O que apareceu no diagnóstico", ...pontos(v, p).map((pt, i) => `${i + 1}. ${pt}`));
  return L.join("\n");
}

export function nomeArquivoResumo(v: OnboardingValores): string {
  const base = texto(v.aluno) || "aluno";
  return `diagnostico-${base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w]+/g, "-")
    .toLowerCase()}.md`;
}
