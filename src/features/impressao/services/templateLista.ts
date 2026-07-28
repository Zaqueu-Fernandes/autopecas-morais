/**
 * ============================================================================
 * TEMPLATES HTML — IMPRESSÃO DE LISTA (relatório tabular genérico)
 * ============================================================================
 * Usado pelas telas de listagem (Clientes, Estoque, Financeiro…), diferente
 * do comprovante (que é um documento único de uma OS/venda). Duas versões:
 *
 *   Térmica 80mm: uma tabela de verdade com várias colunas não cabe numa
 *   bobina de 80mm — vira uma "ficha" por linha (1ª coluna como título,
 *   demais como rótulo: valor), separadas por traço.
 *
 *   A4/Carta: tabela cheia, uma linha por registro, como um relatório normal.
 * ============================================================================
 */

import type { DocumentoListaImpressao } from '../types';

const NOME_EMPRESA = 'Autopeças Morais';

function escapar(texto: string): string {
  return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function gerarHtmlListaTermica(doc: DocumentoListaImpressao): string {
  const geradoEm = new Date().toLocaleString('pt-BR');

  const fichas = doc.linhas
    .map((linha) => {
      const [primeira, ...resto] = linha;
      const detalhes = resto
        .map((valor, i) =>
          valor ? `<div class="linha"><span>${escapar(doc.colunas[i + 1] ?? '')}:</span><span>${escapar(valor)}</span></div>` : '',
        )
        .join('');
      return `<div class="ficha"><strong>${escapar(primeira ?? '')}</strong>${detalhes}</div>`;
    })
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
    font-size: 11px;
    line-height: 1.4;
    color: #000;
  }
  h1 { font-size: 14px; text-align: center; margin: 0 0 1mm; }
  .subtitulo { text-align: center; font-size: 11px; margin: 0 0 1mm; }
  .gerado { text-align: center; font-size: 9px; color: #333; margin: 0 0 3mm; }
  .separador { border-top: 1px dashed #000; margin: 2mm 0; }
  .ficha { padding: 1.5mm 0; border-bottom: 1px dashed #000; }
  .ficha strong { display: block; font-size: 12px; margin-bottom: .5mm; }
  .linha { display: flex; justify-content: space-between; gap: 4px; font-size: 10.5px; }
  .rodape { text-align: center; font-size: 9px; margin-top: 4mm; }
  .total-registros { text-align: center; font-size: 10px; margin-top: 2mm; font-weight: bold; }
</style>
</head>
<body>
  <h1>${escapar(NOME_EMPRESA)}</h1>
  <p class="subtitulo">${escapar(doc.titulo)}</p>
  ${doc.subtitulo ? `<p class="subtitulo">${escapar(doc.subtitulo)}</p>` : ''}
  <p class="gerado">Gerado em ${geradoEm}</p>
  <div class="separador"></div>
  ${fichas || '<p class="gerado">Nenhum registro.</p>'}
  <p class="total-registros">${doc.linhas.length} registro(s)</p>
  <div class="rodape">DOCUMENTO SEM VALOR FISCAL</div>
</body>
</html>`;
}

export function gerarHtmlListaA4(doc: DocumentoListaImpressao): string {
  const geradoEm = new Date().toLocaleString('pt-BR');

  const cabecalho = doc.colunas.map((c) => `<th>${escapar(c)}</th>`).join('');
  const linhas = doc.linhas
    .map((linha) => `<tr>${linha.map((v) => `<td>${escapar(v)}</td>`).join('')}</tr>`)
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapar(doc.titulo)}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
    color: #111;
  }
  .cab { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 14px; }
  .cab h1 { font-size: 18px; margin: 0 0 2px; }
  .cab .subtitulo { font-size: 12px; color: #444; margin: 0; }
  .cab .gerado { font-size: 11px; color: #666; text-align: right; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #ddd; }
  th { font-size: 10px; text-transform: uppercase; color: #666; border-bottom: 2px solid #111; }
  tbody tr:nth-child(even) { background: #f7f7f7; }
  .rodape { display: flex; justify-content: space-between; font-size: 11px; color: #666; margin-top: 14px; border-top: 1px solid #ddd; padding-top: 8px; }
</style>
</head>
<body>
  <div class="cab">
    <div>
      <h1>${escapar(NOME_EMPRESA)}</h1>
      <p class="subtitulo">${escapar(doc.titulo)}${doc.subtitulo ? ` — ${escapar(doc.subtitulo)}` : ''}</p>
    </div>
    <div class="gerado">Gerado em ${geradoEm}</div>
  </div>

  <table>
    <thead><tr>${cabecalho}</tr></thead>
    <tbody>${linhas}</tbody>
  </table>

  <div class="rodape">
    <span>${doc.linhas.length} registro(s)</span>
    <span>DOCUMENTO SEM VALOR FISCAL</span>
  </div>
</body>
</html>`;
}
