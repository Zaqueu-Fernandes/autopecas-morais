/**
 * ============================================================================
 * CATEGORIAS (de despesa / conta a pagar) — PONTO DE ENTRADA
 * ============================================================================
 * import { FormCategoria, listarCategorias } from '@/features/categorias';
 * Sem CSS próprio — reaproveita .dsp-* de '@/features/despesas/despesas.css'.
 */

export { FormCategoria } from './components/FormCategoria';
export * from './services/categorias.service';

export { semErros, validarNomeCategoria, gerarChaveCategoria, type Categoria, type ErrosValidacao } from './types';
