/**
 * ============================================================================
 * AUTH (login + perfis admin/operador) — PONTO DE ENTRADA
 * ============================================================================
 * import { AuthProvider, useAuth, LoginPage } from '@/features/auth';
 * import '@/features/auth/auth.css';
 */

export { AuthProvider, useAuth } from './hooks/useAuth';
export { LoginPage } from './components/LoginPage';
export { listarPerfis } from './services/auth.service';
export type { Perfil, Papel } from './types';
