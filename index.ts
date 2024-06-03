import { Document, Paragraph, TextRun, Packer } from "docx";

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

const criarMensagemPregoeiro = (mensagem: Mensagem) => {
  return new Paragraph({
    children: [
      new TextRun({
        text: `Pregoeiro - ${mensagem.dataHora}`,
        bold: true,
        break: 1,
        color: "4287f5"
      }),
      new TextRun({
        text: `-------------------------`,
        break: 1
      }),
      new TextRun({
        text: mensagem.texto,
        break: 1
      }),
      new TextRun({
        text: `-------------------------`,
        break: 1
      }),
    ]
  })
}

const criarMensagemFornecedor = (mensagem: Mensagem) => {
  return new Paragraph({
    children: [
      new TextRun({
        text: `Fornecedor - ${mensagem.dataHora}`,
        bold: true,
        break: 1,
        color: "962d00"
      }),
      new TextRun({
        text: `CNPJ: ${mensagem.identificadorRemetente?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || ""}`,
        break: 1
      }),
      new TextRun({
        text: `CNPJ Não formatado: ${mensagem.identificadorRemetente || ""}`,
        break: 1
      }),
      new TextRun({
        text: `-------------------------`,
        break: 1
      }),
      new TextRun({
        text: mensagem.texto,
        break: 1
      }),
      new TextRun({
        text: `-------------------------`,
        break: 1
      }),
    ]
  })
}

const criarMensagemSistema = (mensagem: Mensagem) => {
  return new Paragraph({
    children: [
      new TextRun({
        text: `Sistema - ${mensagem.dataHora}`,
        bold: true,
        break: 1,
      }),
      new TextRun({
        text: `CNPJ: ${mensagem.identificadorDestinatario?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || ""}`,
        break: 1
      }),
      new TextRun({
        text: `CNPJ Não formatado: ${mensagem.identificadorDestinatario || ""}`,
        break: 1
      }),
      new TextRun({
        text: `-------------------------`,
        break: 1
      }),
      new TextRun({
        text: mensagem.texto,
        break: 1
      }),
      new TextRun({
        text: `-------------------------`,
        break: 1
      }),
    ]
  })
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

const formatarMesagem = (mensagem: Mensagem) => {
  switch (mensagem.tipoRemetente) {
    case '1':
      return criarMensagemFornecedor(mensagem)
    case '3':
      return criarMensagemPregoeiro(mensagem)
    default:
      return criarMensagemSistema(mensagem);
  }
}

const escreverMensagensEmArquivo = (mensagens: Mensagem[], nomeArquivo: string) => {
  const fs = require('fs');

  const mensagensFormatadas = mensagens.map(mensagem => formatarMesagem(mensagem));

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: mensagensFormatadas
      }
    ]
  });


  Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("mensagensFormatadas.docx", buffer);
  });
}

const mensagensEmOrdemCronologicaFiltradas = mensagensEmOrdemCronologica.filter((mensagem): mensagem is Mensagem => mensagem !== undefined);

escreverMensagensEmArquivo(mensagensEmOrdemCronologicaFiltradas, 'mensagensFormatadas.txt');


