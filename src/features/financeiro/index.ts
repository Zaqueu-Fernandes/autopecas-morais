/**
 * ============================================================================
 * FINANCEIRO — PONTO DE ENTRADA
 * ============================================================================
 * import { FormContaPagar, listarFinanceiro } from '@/features/financeiro';
 * import '@/features/financeiro/financeiro.css';
 */

export { FormContaPagar } from './components/FormContaPagar';
export { FormQuitacao } from './components/FormQuitacao';
export { FormEditarValor } from './components/FormEditarValor';
export { FormFaturamento } from './components/FormFaturamento';
export { FormFinalizarVenda } from './components/FormFinalizarVenda';

export * from './services/financeiro.service';
export { faturarOS } from './services/faturamento.service';
export { finalizarVenda } from './services/venda.service';
export {
  buscarFluxoCaixa,
  type MovimentoCaixa,
  type ResultadoFluxoCaixa,
} from './services/fluxoCaixa.service';

export {
  semErros,
  dadosContaPagarVazio,
  validarContaPagar,
  validarQuitacao,
  dadosFaturamentoVazio,
  validarFaturamento,
  ROTULO_CATEGORIA_RECEBER,
  ROTULO_FORMA_PAGAMENTO,
  ROTULO_SITUACAO,
  type TipoFinanceiro,
  type CategoriaPagar,
  type CategoriaReceber,
  type Periodicidade,
  type FormaPagamento,
  type LancamentoFinanceiro,
  type DadosContaPagar,
  type DadosQuitacao,
  type SituacaoRecebimento,
  type DadosFaturamento,
  type ErrosValidacao,
} from './types';
