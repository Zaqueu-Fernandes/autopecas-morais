/**
 * ============================================================================
 * EMPRESA (configuração) — PONTO DE ENTRADA
 * ============================================================================
 * import { FormConfigEmpresa, buscarConfigEmpresa } from '@/features/empresa';
 * import '@/features/empresa/empresa.css';
 */

export { FormConfigEmpresa } from './components/FormConfigEmpresa';
export * from './services/empresa.service';

export {
  configEmpresaVazia,
  validarConfigEmpresa,
  semErros,
  ROTULO_REGIME,
  type RegimeTributario,
  type ConfigEmpresa,
  type ErrosValidacao,
} from './types';
