/**
 * ============================================================================
 * DASHBOARD — PONTO DE ENTRADA
 * ============================================================================
 * import { CartaoResumo, MonitorMei, buscarResumoDashboard } from '@/features/dashboard';
 * import '@/features/dashboard/dashboard.css';
 */

export { CartaoResumo } from './components/CartaoResumo';
export { MonitorMei } from './components/MonitorMei';
export { buscarResumoDashboard, type ResumoDashboard } from './services/dashboard.service';
