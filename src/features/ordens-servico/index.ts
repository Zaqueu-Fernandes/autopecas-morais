/**
 * ============================================================================
 * ORDENS DE SERVIÇO — PONTO DE ENTRADA
 * ============================================================================
 * import { FormOS, DetalheOS, listarOS } from '@/features/ordens-servico';
 * import '@/features/ordens-servico/ordens-servico.css';
 */

export { FormOS } from './components/FormOS';
export { FormItemOS } from './components/FormItemOS';
export { ListaItensOS } from './components/ListaItensOS';
export { DetalheOS } from './components/DetalheOS';

export * from './services/os.service';
export * from './services/itens.service';

export {
  ordemServicoVazia,
  validarOS,
  semErros,
  dadosItemPecaVazio,
  validarItemPeca,
  dadosItemServicoVazio,
  validarItemServico,
  ROTULO_STATUS_OS,
  PROXIMO_STATUS,
  type StatusOS,
  type OrdemServico,
  type OrdemServicoResumo,
  type TipoItemOS,
  type ItemOS,
  type DadosItemPeca,
  type DadosItemServico,
  type ErrosValidacao,
} from './types';
