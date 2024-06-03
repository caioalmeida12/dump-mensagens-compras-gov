type Mensagem = {
  chaveCompra: {
    idUasgIdentificacao: number,
    idModalidade: number,
    numero: number,
    ano: number,
    numeroUasg: number
  },
  identificadorItem?: string,
  chaveMensagemNaOrigem: string,
  texto: string,
  categoria: string,
  dataHora: string,
  tipoRemetente: "0" | "1" | "3",
  identificadorRemetente?: string,
  identificadorDestinatario?: string
}

const lerArquivo = (nomeArquivo: string) => {
  const fs = require('fs');
  const arquivo = fs.readFileSync(nomeArquivo, 'utf-8');
  return arquivo;
}

// Lendo as mensagens do arquivo
// As mensagens são armazenadas no formato Mensagem[][]
const mensagensDoArquivo = lerArquivo('mensagens.json');

const mensagens = JSON.parse(mensagensDoArquivo) as Mensagem[][];

const mensagensFlat = mensagens.flat();

const mensagensDeduped = new Set(mensagensFlat.map(mensagem => mensagem.chaveMensagemNaOrigem));

const mensagensFlatDeduped = Array.from(mensagensDeduped).map(chave => mensagensFlat.find(mensagem => mensagem.chaveMensagemNaOrigem === chave));

const mensagensEmOrdemCronologica = mensagensFlatDeduped.sort((a, b) => {
  if (!a || !b) return 0;

  const dataHoraA = new Date(a.dataHora);
  const dataHoraB = new Date(b.dataHora);

  return dataHoraB.getTime() - dataHoraA.getTime();
});

const remetentePorTipo = {
  "0": "Sistema",
  "1": "Fornecedor",
  "3": "Pregoeiro",
} as const

const formatarMensagemDoSistema = (mensagem: Mensagem) => {
  // Mensagem do sistema
  /**
   * Sistema -> Destinatário (Nome da empresa) - Data e hora
   * CNPJ: 00.000.000/0000-00 - Razão Social
   * CNPJ Não formatado: 00000000000000
   * -------------------------
   * Texto da mensagem
   * -------------------------
   * 
   */

  const remetente = remetentePorTipo[mensagem.tipoRemetente];
  const destinatario = mensagem.identificadorDestinatario || 'Não informado';
  const dataHora = mensagem.dataHora;
  const texto = mensagem.texto;
  const cnpjFormatado = mensagem.identificadorDestinatario?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || 'Não informado';
  const razaoSocial = mensagem.identificadorDestinatario || 'Não informado';
  const cnpjNaoFormatado = mensagem.identificadorDestinatario || 'Não informado';

  return `${remetente} -> ${destinatario} - ${dataHora}\nCNPJ: ${cnpjFormatado} - ${razaoSocial}\nCNPJ Não formatado: ${cnpjNaoFormatado}\n-------------------------\n${texto}\n-------------------------\n`;
}

const formatarMensagemDoFornecedor = (mensagem: Mensagem) => {
  // Mensagem do fornecedor
  /**
   * Fornecedor -> Pregoeiro - Data e hora
   * CNPJ: 00.000.000/0000-00 - Razão Social
   * CNPJ Não formatado: 00000000000000
   * -------------------------
   * Texto da mensagem
   * -------------------------
   * 
   */

  const remetente = remetentePorTipo[mensagem.tipoRemetente];
  const dataHora = mensagem.dataHora;
  const texto = mensagem.texto;
  const cnpjFormatado = mensagem.identificadorRemetente?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || 'Não informado';
  const razaoSocial = mensagem.identificadorRemetente || 'Não informado';
  const cnpjNaoFormatado = mensagem.identificadorRemetente || 'Não informado';

  return `${remetente} -> Pregoeiro - ${dataHora}\nCNPJ: ${cnpjFormatado} - ${razaoSocial}\nCNPJ Não formatado: ${cnpjNaoFormatado}\n-------------------------\n${texto}\n-------------------------\n`;
}

const formatarMensagemDoPregoeiro = (mensagem: Mensagem) => {
  // Mensagem do pregoeiro
  /**
   * Pregoeiro -> Fornecedor - Data e hora
   * CNPJ: 00.000.000/0000-00 - Razão Social
   * CNPJ Não formatado: 00000000000000
   * -------------------------
   * Texto da mensagem
   * -------------------------
   * 
   */

  const remetente = remetentePorTipo[mensagem.tipoRemetente];
  const destinatario = mensagem.identificadorDestinatario || 'Não informado';
  const dataHora = mensagem.dataHora;
  const texto = mensagem.texto;
  const cnpjFormatado = mensagem.identificadorDestinatario?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || 'Não informado';
  const razaoSocial = mensagem.identificadorDestinatario || 'Não informado';
  const cnpjNaoFormatado = mensagem.identificadorDestinatario || 'Não informado';

  return `${remetente} -> ${destinatario} - ${dataHora}\nCNPJ: ${cnpjFormatado} - ${razaoSocial}\nCNPJ Não formatado: ${cnpjNaoFormatado}\n-------------------------\n${texto}\n-------------------------\n`;
}

const formatarMesagem = (mensagem: Mensagem) => {
  switch (mensagem.tipoRemetente) {
    case '0':
      return formatarMensagemDoSistema(mensagem);
    case '1':
      return formatarMensagemDoFornecedor(mensagem);
    case '3':
      return formatarMensagemDoPregoeiro(mensagem);
    default:
      return '';
  }
}

const escreverMensagensEmArquivo = (mensagens: Mensagem[], nomeArquivo: string) => {
  const fs = require('fs');

  const mensagensFormatadas = mensagens.map(mensagem => formatarMesagem(mensagem));

  if (fs.existsSync(nomeArquivo)) {
    fs.unlinkSync(nomeArquivo);
  }
  
  fs.writeFileSync(nomeArquivo, mensagensFormatadas.join('\n'));
}

const mensagensEmOrdemCronologicaFiltradas = mensagensEmOrdemCronologica.filter((mensagem): mensagem is Mensagem => mensagem !== undefined);

escreverMensagensEmArquivo(mensagensEmOrdemCronologicaFiltradas, 'mensagensFormatadas.txt');