/**
 * ============================================================================
 * PERMISSÕES — PONTO DE ENTRADA
 * ============================================================================
 * import { listarOperadoresComPermissoes, definirPermissao } from '@/features/permissoes';
 * import '@/features/permissoes/permissoes.css';
 */

export {
  listarOperadoresComPermissoes,
  definirPermissao,
  buscarMinhasPermissoes,
} from './services/permissoes.service';

export {
  CHAVES_PERMISSAO,
  ROTULO_PERMISSAO,
  type ChavePermissao,
  type Operador,
  type OperadorComPermissoes,
} from './types';
