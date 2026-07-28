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

import { Printer, FileDown } from 'lucide-react';
import { printer } from '../services/printer.service';
import { gerarPdfLista } from '../services/pdf.service';
import type { DocumentoListaImpressao } from '../types';

interface Props {
  documento: DocumentoListaImpressao;
  className?: string;
}

export function BotoesImpressaoLista({ documento, className }: Props) {
  return (
    <>
      <button type="button" className={className} onClick={() => printer.imprimirLista(documento)}>
        <Printer size={15} /> Imprimir
      </button>
      <button type="button" className={className} onClick={() => gerarPdfLista(documento)}>
        <FileDown size={15} /> Gerar PDF
      </button>
    </>
  );
}
