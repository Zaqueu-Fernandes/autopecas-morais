/**
 * ============================================================================
 * IMPORTAÇÃO DE XML DE NF-e — PONTO DE ENTRADA
 * ============================================================================
 * import { ImportarXmlNFe } from '@/features/importacao-nfe';
 * import '@/features/importacao-nfe/importacao-nfe.css';
 */

export { ImportarXmlNFe } from './components/ImportarXmlNFe';
export { parseNFe } from './services/parseNFe';
export { verificarNFeJaImportada, registrarNFeImportada } from './services/nfeImportadas.service';

export type { ItemNFeExtraido, DadosNFeExtraida, MapeamentoItem, ResultadoImportacaoNFe } from './types';
