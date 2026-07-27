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
export { printer } from './services/printer.service';
export type { DocumentoImpressao, ItemImpressao } from './types';
