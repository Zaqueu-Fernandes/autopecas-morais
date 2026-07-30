/**
 * ============================================================================
 * DASHBOARD — PONTO DE ENTRADA
 * ============================================================================
 * import { CartaoResumo, MonitorMei, buscarResumoDashboard } from '@/features/dashboard';
 * import '@/features/dashboard/dashboard.css';
 */

export { CartaoResumo } from './components/CartaoResumo';
export { MonitorMei } from './components/MonitorMei';
export { MonitorCustoAquisicao } from './components/MonitorCustoAquisicao';
export { MonitorMeiEmpresa } from './components/MonitorMeiEmpresa';
export {
  buscarResumoDashboard,
  type ResumoDashboard,
  buscarPecasEstoqueBaixo,
  type PecaEstoqueBaixo,
} from './services/dashboard.service';
