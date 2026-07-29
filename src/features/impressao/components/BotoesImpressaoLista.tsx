/**
 * ============================================================================
 * BOTÕES "IMPRIMIR" + "GERAR PDF" — pra telas de listagem
 * ============================================================================
 * Reutilizável em qualquer tela com tabela (Clientes, Estoque, Financeiro…).
 * "Imprimir" abre o diálogo de impressão (térmica 80mm ou A4/Carta, conforme
 * a preferência global — ver useFormatoImpressao). "Gerar PDF" baixa o
 * arquivo direto, sem diálogo — sempre em A4/Carta (ver pdf.service.ts).
 * Recebe a classe do botão de quem chama, pra herdar o estilo da feature.
 */

import { useState } from 'react';
import { Printer, FileDown } from 'lucide-react';
import { printer } from '../services/printer.service';
import { gerarPdfLista } from '../services/pdf.service';
import type { DocumentoListaImpressao } from '../types';

interface Props {
  documento: DocumentoListaImpressao;
  className?: string;
}

export function BotoesImpressaoLista({ documento, className }: Props) {
  // Evita clique duplo em listas grandes, onde montar o documento demora um
  // pouco — desabilita e sinaliza qual dos dois botões está rodando.
  const [imprimindo, setImprimindo] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  async function handleImprimir() {
    setImprimindo(true);
    try {
      await printer.imprimirLista(documento);
    } finally {
      setImprimindo(false);
    }
  }

  async function handleGerarPdf() {
    setGerandoPdf(true);
    try {
      await gerarPdfLista(documento);
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={handleImprimir} disabled={imprimindo || gerandoPdf}>
        <Printer size={15} /> {imprimindo ? 'Imprimindo…' : 'Imprimir'}
      </button>
      <button type="button" className={className} onClick={handleGerarPdf} disabled={imprimindo || gerandoPdf}>
        <FileDown size={15} /> {gerandoPdf ? 'Gerando…' : 'Gerar PDF'}
      </button>
    </>
  );
}
