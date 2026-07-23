// Monta um link que abre o WhatsApp (app ou web) com uma mensagem pronta
// no campo de texto. Sem número de telefone/grupo, o WhatsApp abre a tela
// de "encaminhar para" — a pessoa escolhe o grupo e confirma o envio, já
// que não existe (nem deveria existir) um jeito de um site enviar uma
// mensagem em nome de alguém sem essa confirmação manual.
export function linkWhatsapp(mensagem: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`;
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
