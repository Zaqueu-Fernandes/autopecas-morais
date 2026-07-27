/**
 * ============================================================================
 * ESTOQUE — PONTO DE ENTRADA
 * ============================================================================
 * import { FormPeca, listarPecas } from '@/features/estoque';
 * import '@/features/estoque/estoque.css';
 */

export { FormPeca } from './components/FormPeca';
export { FormMovimentacao } from './components/FormMovimentacao';
export { MovimentacoesDaPeca } from './components/MovimentacoesDaPeca';

export * from './services/pecas.service';
export * from './services/movimentacao.service';

export {
  pecaVazia,
  validarPeca,
  semErros,
  dadosEntradaVazio,
  dadosAjusteVazio,
  validarEntrada,
  validarAjuste,
  type Peca,
  type Movimentacao,
  type TipoMovimentacao,
  type DadosEntrada,
  type DadosAjuste,
  type ErrosValidacao,
} from './types';
