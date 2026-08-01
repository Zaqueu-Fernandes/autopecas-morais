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
export { FormEstorno } from './components/FormEstorno';

export * from './services/financeiro.service';
export { faturarOS } from './services/faturamento.service';
export { finalizarVenda } from './services/venda.service';
export { estornarLancamento } from './services/estorno.service';
export {
  buscarIdsOcultosParaUsuario,
  buscarTodasOcultacoes,
  sincronizarOcultacoesEmLote,
} from './services/ocultacoes.service';
export {
  buscarFluxoCaixa,
  type MovimentoCaixa,
  type ResultadoFluxoCaixa,
} from './services/fluxoCaixa.service';

export {
  semErros,
  dadosContaPagarVazio,
  validarContaPagar,
  dadosQuitacaoVazio,
  validarQuitacao,
  dadosFaturamentoVazio,
  validarFaturamento,
  dadosEstornoVazio,
  validarEstorno,
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
  type DadosEstorno,
  type ErrosValidacao,
} from './types';
