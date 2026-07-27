/**
 * ============================================================================
 * ACESSO AO BANCO — NF-e IMPORTADAS
 * ============================================================================
 * Único lugar que fala com a tabela `nfe_importadas`. Só controla
 * duplicidade + histórico; os itens em si viram movimentacao_estoque via
 * registrarEntrada (feature estoque).
 */

import { supabase } from '@/lib/supabase';

/** true se essa chave de acesso já foi importada antes. */
export async function verificarNFeJaImportada(chaveAcesso: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('nfe_importadas')
    .select('id')
    .eq('chave_acesso', chaveAcesso)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function registrarNFeImportada(input: {
  chaveAcesso: string;
  numero: string;
  serie: string;
  fornecedorId: string | null;
  valorTotal: number;
}): Promise<void> {
  const { error } = await supabase.from('nfe_importadas').insert({
    chave_acesso: input.chaveAcesso,
    numero: input.numero || null,
    serie: input.serie || null,
    fornecedor_id: input.fornecedorId,
    valor_total: input.valorTotal || null,
  });
  if (error) throw error;
}
