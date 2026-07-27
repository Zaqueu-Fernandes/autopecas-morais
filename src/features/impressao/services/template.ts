/**
 * ============================================================================
 * TEMPLATE HTML — COMPROVANTE 80mm
 * ============================================================================
 * Gera um HTML autocontido (com <style> embutido) formatado pra bobina de
 * impressora térmica de 80mm. Usado pelo método 'browser' do PrinterService.
 */

import type { DocumentoImpressao } from '../types';

const NOME_EMPRESA = 'Autopeças Morais';

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function gerarHtmlComprovante(doc: DocumentoImpressao): string {
  const dataFormatada = doc.data.toLocaleString('pt-BR');

  const linhasItens = doc.itens
    .map(
      (item) => `
        <tr>
          <td class="descricao">${escapar(item.descricao)}</td>
          <td class="qtd">${item.quantidade}x</td>
          <td class="valor">${formatarMoeda(item.quantidade * item.valorUnit)}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapar(doc.titulo)}</title>
<style>
  @page { margin: 0; size: 80mm auto; }
  * { box-sizing: border-box; }
  body {
    width: 76mm;
    margin: 0 auto;
    padding: 4mm 3mm 8mm;
    font-family: 'Courier New', Courier, monospace;
    font-size: 11.5px;
    line-height: 1.4;
    color: #000;
  }
  h1 { font-size: 14px; text-align: center; margin: 0 0 1mm; }
  .subtitulo { text-align: center; font-size: 12px; margin: 0 0 3mm; }
  .linha { display: flex; justify-content: space-between; gap: 6px; }
  .separador { border-top: 1px dashed #000; margin: 2mm 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 1mm; }
  td { padding: 1mm 0; vertical-align: top; }
  .descricao { width: 60%; }
  .qtd { width: 15%; text-align: center; }
  .valor { width: 25%; text-align: right; }
  .total-linha { display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-top: 2mm; }
  .rodape { text-align: center; font-size: 10px; margin-top: 4mm; }
  .rodape strong { display: block; margin-bottom: 1mm; }
</style>
</head>
<body>
  <h1>${escapar(NOME_EMPRESA)}</h1>
  <p class="subtitulo">${escapar(doc.titulo)}</p>

  <div class="linha"><span>Nº ${escapar(String(doc.numero))}</span><span>${dataFormatada}</span></div>

  ${
    doc.cliente
      ? `<div class="separador"></div>
  <div class="linha"><span>Cliente:</span><span>${escapar(doc.cliente.nome)}</span></div>
  ${doc.cliente.documento ? `<div class="linha"><span>Documento:</span><span>${escapar(doc.cliente.documento)}</span></div>` : ''}
  ${doc.cliente.telefone ? `<div class="linha"><span>Telefone:</span><span>${escapar(doc.cliente.telefone)}</span></div>` : ''}`
      : ''
  }

  ${
    doc.veiculo
      ? `<div class="linha"><span>Veículo:</span><span>${escapar(doc.veiculo.placa)} ${escapar(doc.veiculo.marcaModelo ?? '')}</span></div>`
      : ''
  }

  <div class="separador"></div>
  <table>
    <tbody>${linhasItens}</tbody>
  </table>
  <div class="separador"></div>

  <div class="total-linha"><span>TOTAL</span><span>R$ ${formatarMoeda(doc.total)}</span></div>

  ${doc.observacoes ? `<div class="separador"></div><div>${escapar(doc.observacoes)}</div>` : ''}

  <div class="rodape">
    <strong>DOCUMENTO SEM VALOR FISCAL</strong>
    Comprovante interno — não substitui nota fiscal.
  </div>
</body>
</html>`;
}
