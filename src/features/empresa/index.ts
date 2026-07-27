/**
 * ============================================================================
 * EMPRESA (multi-CNPJ) — PONTO DE ENTRADA
 * ============================================================================
 * import { FormEmpresa, listarEmpresas } from '@/features/empresa';
 * import '@/features/empresa/empresa.css';
 */

export { FormEmpresa } from './components/FormEmpresa';
export * from './services/empresa.service';

export {
  empresaVazia,
  validarEmpresa,
  semErros,
  ROTULO_REGIME,
  type RegimeTributario,
  type Empresa,
  type ErrosValidacao,
} from './types';
