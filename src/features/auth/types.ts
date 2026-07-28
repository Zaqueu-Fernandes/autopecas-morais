/**
 * ============================================================================
 * TIPOS — AUTENTICAÇÃO / PERFIS
 * ============================================================================
 */

export type Papel = 'admin' | 'operador';

export interface Perfil {
  id: string;
  nome: string;
  papel: Papel;
  ativo: boolean;
}
