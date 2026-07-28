/**
 * ============================================================================
 * PDF SERVICE — gera e baixa um PDF de uma lista, num clique só
 * ============================================================================
 * Diferente de printer.imprimirLista (que abre o diálogo de impressão do
 * navegador), isso aqui gera o arquivo .pdf direto e dispara o download —
 * é a diferença real entre o botão "Imprimir" e o botão "Gerar PDF" nas
 * telas de listagem. Sempre em A4/Carta (formato de papel não faz sentido
 * pra um arquivo puramente digital, então ignora a preferência térmica/A4).
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DocumentoListaImpressao } from '../types';

const NOME_EMPRESA = 'Autopeças Morais';

function nomeArquivo(titulo: string): string {
  const slug = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const data = new Date().toISOString().slice(0, 10);
  return `${slug || 'relatorio'}-${data}.pdf`;
}

export function gerarPdfLista(doc: DocumentoListaImpressao): void {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  pdf.setFontSize(16);
  pdf.text(NOME_EMPRESA, 14, 16);
  pdf.setFontSize(11);
  pdf.setTextColor(90);
  pdf.text(doc.subtitulo ? `${doc.titulo} — ${doc.subtitulo}` : doc.titulo, 14, 23);
  pdf.setFontSize(9);
  pdf.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 28);
  pdf.setTextColor(0);

  autoTable(pdf, {
    startY: 33,
    head: [doc.colunas],
    body: doc.linhas,
    styles: { fontSize: 9, cellPadding: 2.2 },
    headStyles: { fillColor: [214, 40, 57], textColor: 255 },
    alternateRowStyles: { fillColor: [247, 247, 247] },
  });

  const finalY = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? 33;
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  pdf.text(`${doc.linhas.length} registro(s) — documento sem valor fiscal`, 14, finalY + 8);

  pdf.save(nomeArquivo(doc.titulo));
}
