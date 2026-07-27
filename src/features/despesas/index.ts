/**
 * ============================================================================
 * DESPESAS FIXAS — PONTO DE ENTRADA
 * ============================================================================
 * import { FormDespesaFixa, listarDespesasFixas } from '@/features/despesas';
 * import '@/features/despesas/despesas.css';
 */

export { FormDespesaFixa } from './components/FormDespesaFixa';

export * from './services/despesas.service';
export { gerarContasDoMes, type ResultadoGeracao } from './services/gerarContas.service';

export {
  despesaFixaVazia,
  validarDespesaFixa,
  semErros,
  ROTULO_CATEGORIA_DESPESA,
  type CategoriaDespesaFixa,
  type DespesaFixa,
  type ErrosValidacao,
} from './types';
