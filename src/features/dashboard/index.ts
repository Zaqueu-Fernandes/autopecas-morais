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
export { buscarResumoDashboard, type ResumoDashboard } from './services/dashboard.service';
// Mora em @/features/estoque de verdade (só lê `pecas`) — reexportado aqui
// pra não quebrar quem já importava buscarPecasEstoqueBaixo daqui.
export { buscarPecasEstoqueBaixo, type PecaEstoqueBaixo } from '@/features/estoque';
