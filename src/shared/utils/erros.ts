/**
 * ============================================================================
 * HELPERS — ERROS DO SUPABASE/POSTGRES
 * ============================================================================
 */

/** true se o erro veio de uma FK apontando pra esta linha (ex.: já tem histórico vinculado). */
export function ehViolacaoDeReferencia(erro: unknown): boolean {
  return typeof erro === 'object' && erro !== null && (erro as { code?: string }).code === '23503';
}
