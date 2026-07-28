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
  ROTULO_TIPO_VALOR,
  type CategoriaDespesaFixa,
  type TipoValorDespesa,
  type DespesaFixa,
  type ErrosValidacao,
} from './types';
