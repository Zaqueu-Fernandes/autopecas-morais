/**
 * ============================================================================
 * VENDAS DE BALCÃO — PONTO DE ENTRADA
 * ============================================================================
 * import { DetalheVenda, listarVendas } from '@/features/vendas';
 * import '@/features/vendas/vendas.css';
 */

export { FormItemVenda } from './components/FormItemVenda';
export { ListaItensVenda } from './components/ListaItensVenda';
export { DetalheVenda } from './components/DetalheVenda';

export * from './services/vendas.service';
export * from './services/itens.service';

export {
  vendaBalcaoVazia,
  semErros,
  dadosItemVendaVazio,
  validarItemVenda,
  type StatusVenda,
  type VendaBalcao,
  type VendaBalcaoResumo,
  type ItemVenda,
  type DadosItemVenda,
  type ErrosValidacao,
} from './types';
