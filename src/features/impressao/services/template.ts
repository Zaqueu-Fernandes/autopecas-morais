/**
 * ============================================================================
 * TEMPLATES HTML — COMPROVANTE (térmica 80mm e A4/Carta)
 * ============================================================================
 * Gera um HTML autocontido (com <style> embutido) — dois formatos possíveis,
 * escolhidos pela preferência global (ver useFormatoImpressao). Usado pelo
 * método 'browser' do PrinterService.
 */

import type { DocumentoImpressao } from '../types';

const NOME_EMPRESA = 'Autopeças Morais';

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function gerarHtmlComprovanteTermica(doc: DocumentoImpressao): string {
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

export function gerarHtmlComprovanteA4(doc: DocumentoImpressao): string {
  const dataFormatada = doc.data.toLocaleString('pt-BR');

  const linhasItens = doc.itens
    .map(
      (item) => `
        <tr>
          <td>${escapar(item.descricao)}</td>
          <td class="centro">${item.quantidade}</td>
          <td class="direita">R$ ${formatarMoeda(item.valorUnit)}</td>
          <td class="direita">R$ ${formatarMoeda(item.quantidade * item.valorUnit)}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapar(doc.titulo)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body {
    max-width: 700px;
    margin: 0 auto;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    color: #111;
  }
  .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 16px; }
  .cab h1 { font-size: 20px; margin: 0; }
  .cab .num-data { text-align: right; font-size: 12px; color: #444; }
  .cab .num-data strong { display: block; font-size: 14px; color: #111; }
  h2 { font-size: 15px; margin: 0 0 10px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 18px; font-size: 12px; }
  .info-grid .rotulo { color: #666; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  th, td { padding: 8px 6px; text-align: left; border-bottom: 1px solid #ddd; }
  th { font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #111; }
  .centro { text-align: center; }
  .direita { text-align: right; }
  .total-box { display: flex; justify-content: flex-end; margin-bottom: 18px; }
  .total-box .valor { font-size: 18px; font-weight: bold; border-top: 2px solid #111; padding-top: 8px; min-width: 200px; text-align: right; }
  .obs { font-size: 12px; color: #444; margin-bottom: 18px; }
  .rodape { text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
  .rodape strong { display: block; color: #111; margin-bottom: 2px; }
</style>
</head>
<body>
  <div class="cab">
    <h1>${escapar(NOME_EMPRESA)}</h1>
    <div class="num-data">
      <strong>${escapar(doc.titulo)} nº ${escapar(String(doc.numero))}</strong>
      ${dataFormatada}
    </div>
  </div>

  ${
    doc.cliente || doc.veiculo
      ? `<div class="info-grid">
    ${doc.cliente ? `<div><span class="rotulo">Cliente: </span>${escapar(doc.cliente.nome)}</div>` : '<div></div>'}
    ${doc.cliente?.documento ? `<div><span class="rotulo">Documento: </span>${escapar(doc.cliente.documento)}</div>` : '<div></div>'}
    ${doc.cliente?.telefone ? `<div><span class="rotulo">Telefone: </span>${escapar(doc.cliente.telefone)}</div>` : '<div></div>'}
    ${doc.veiculo ? `<div><span class="rotulo">Veículo: </span>${escapar(doc.veiculo.placa)} ${escapar(doc.veiculo.marcaModelo ?? '')}</div>` : '<div></div>'}
  </div>`
      : ''
  }

  <table>
    <thead>
      <tr><th>Descrição</th><th class="centro">Qtd.</th><th class="direita">Valor unit.</th><th class="direita">Subtotal</th></tr>
    </thead>
    <tbody>${linhasItens}</tbody>
  </table>

  <div class="total-box"><div class="valor">TOTAL: R$ ${formatarMoeda(doc.total)}</div></div>

  ${doc.observacoes ? `<p class="obs"><strong>Observações:</strong> ${escapar(doc.observacoes)}</p>` : ''}

  <div class="rodape">
    <strong>DOCUMENTO SEM VALOR FISCAL</strong>
    Comprovante interno — não substitui nota fiscal.
  </div>
</body>
</html>`;
}
