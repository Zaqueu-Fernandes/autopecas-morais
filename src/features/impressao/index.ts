/**
 * ============================================================================
 * IMPRESSÃO — PONTO DE ENTRADA
 * ============================================================================
 * import { BotaoImprimir, printer } from '@/features/impressao';
 *
 * Sem CSS próprio — o BotaoImprimir herda a classe passada por quem chama
 * (os-btn-sec, vd-btn-sec etc.), não tem estilo visual próprio pra manter.
 */

export { BotaoImprimir } from './components/BotaoImprimir';
export { BotoesImpressaoLista } from './components/BotoesImpressaoLista';
export { AlternarFormatoImpressao } from './components/AlternarFormatoImpressao';
export { printer } from './services/printer.service';
export { gerarPdfLista } from './services/pdf.service';
export { useFormatoImpressao, type FormatoImpressao } from './hooks/useFormatoImpressao';
export type { DocumentoImpressao, ItemImpressao, DocumentoListaImpressao } from './types';
