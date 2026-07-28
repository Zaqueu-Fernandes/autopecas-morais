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
  ROTULO_TIPO_VALOR,
  ROTULO_PERIODICIDADE,
  DIAS_SEMANA,
  MESES_ANO,
  type CategoriaDespesaFixa,
  type TipoValorDespesa,
  type Periodicidade,
  type DespesaFixa,
  type ErrosValidacao,
} from './types';
