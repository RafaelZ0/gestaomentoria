// Monta um link que abre o WhatsApp (app ou web) com uma mensagem pronta
// no campo de texto. Sem número de telefone/grupo, o WhatsApp abre a tela
// de "encaminhar para" — a pessoa escolhe o grupo e confirma o envio, já
// que não existe (nem deveria existir) um jeito de um site enviar uma
// mensagem em nome de alguém sem essa confirmação manual.
export function linkWhatsapp(mensagem: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
}

// Telefone no formato do wa.me (só dígitos, com DDI 55). Aceita
// "(28) 99961-1286", "28999611286", "+55 28 99961-1286"... Devolve null se
// não der um número brasileiro plausível (DDD + 8 ou 9 dígitos).
export function normalizarTelefone(telefone: string | null | undefined): string | null {
  let d = (telefone ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10 && d.length !== 11) return null;
  return `55${d}`;
}

// Abre a conversa com o número já escolhido e a mensagem pronta. Nada é
// enviado automaticamente: o WhatsApp abre e a pessoa envia.
export function linkWhatsappPara(telefoneNormalizado: string, mensagem: string): string {
  return `https://wa.me/${telefoneNormalizado}?text=${encodeURIComponent(mensagem)}`;
}

// Lembrete de pagamento: tom cordial e indireto (sem falar em "atraso").
export function mensagemCobranca(nomeMentorado: string, valor: string, vencimento: string): string {
  const primeiroNome = nomeMentorado.trim().split(/\s+/)[0] ?? "";
  return (
    `Oi, ${primeiroNome}! Tudo bem? Passando só para lembrar do pagamento da mentoria, ` +
    `no valor de ${valor}, com vencimento em ${vencimento}. ` +
    `Se já tiver resolvido, pode desconsiderar esta mensagem. Qualquer dúvida, estou por aqui!`
  );
}

export function mensagemConfirmacaoReuniao(
  grupoNome: string,
  data: string,
  hora: string | null
): string {
  const dataFormatada = new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  const horaTexto = hora ? ` às ${hora.slice(0, 5)}` : "";
  return `Oi, pessoal do ${grupoNome}! Lembrando da nossa reunião hoje (${dataFormatada})${horaTexto}. Confirmam presença?`;
}

export function mensagemLinkReuniao(
  grupoNome: string,
  hora: string | null,
  link: string | null
): string {
  const horaTexto = hora ? ` às ${hora.slice(0, 5)}` : "";
  const linkTexto = link ? `\nLink: ${link}` : "";
  return `Nossa reunião do ${grupoNome} começa em 10 minutinhos${horaTexto}!${linkTexto}`;
}
