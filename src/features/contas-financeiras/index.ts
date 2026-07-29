/**
 * ============================================================================
 * CONTAS FINANCEIRAS — PONTO DE ENTRADA
 * ============================================================================
 * import { FormContaFinanceira, listarContasFinanceiras } from '@/features/contas-financeiras';
 * Sem CSS próprio — reaproveita .dsp-* de '@/features/despesas/despesas.css'.
 */

export { FormContaFinanceira } from './components/FormContaFinanceira';
export * from './services/contasFinanceiras.service';

export {
  semErros,
  validarContaFinanceira,
  contaFinanceiraVazia,
  ROTULO_TIPO_CONTA,
  type ContaFinanceira,
  type TipoContaFinanceira,
  type ErrosValidacao,
} from './types';
