/**
 * ============================================================================
 * ACESSO AO BANCO — CONTAS FINANCEIRAS
 * ============================================================================
 * Único lugar que fala com a tabela `contas_financeiras`. Componentes usam
 * essas funções, nunca o Supabase direto (ver regra em CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';
import type { ContaFinanceira, TipoContaFinanceira } from '../types';

interface LinhaContaFinanceira {
  id: string;
  tipo: TipoContaFinanceira;
  instituicao: string;
  empresa_id: string | null;
  ativo: boolean;
}

function linhaParaConta(l: LinhaContaFinanceira): ContaFinanceira {
  return { id: l.id, tipo: l.tipo, instituicao: l.instituicao, empresaId: l.empresa_id, ativo: l.ativo };
}

/**
 * Lista contas financeiras. Por padrão só as ativas, ordenadas por instituição.
 * `empresaId` filtra pra contas DAQUELA empresa + contas compartilhadas (sem
 * empresa definida) — é o filtro usado nos selects de Conta dos formulários
 * de pagamento/recebimento, que reagem à Empresa escolhida no mesmo form.
 * Sem `empresaId`, lista todas (usado pelo próprio cadastro em Cadastros).
 */
export async function listarContasFinanceiras(
  opts: { somenteAtivas?: boolean; empresaId?: string } = {},
): Promise<ContaFinanceira[]> {
  const { somenteAtivas = true, empresaId } = opts;
  let query = supabase.from('contas_financeiras').select('*').order('instituicao');
  if (somenteAtivas) query = query.eq('ativo', true);
  if (empresaId) query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaContaFinanceira[]).map(linhaParaConta);
}

export async function criarContaFinanceira(c: ContaFinanceira): Promise<ContaFinanceira> {
  const { data, error } = await supabase
    .from('contas_financeiras')
    .insert({ tipo: c.tipo, instituicao: c.instituicao, empresa_id: c.empresaId, ativo: c.ativo })
    .select()
    .single();
  if (error) throw error;
  return linhaParaConta(data as LinhaContaFinanceira);
}

export async function atualizarContaFinanceira(c: ContaFinanceira): Promise<ContaFinanceira> {
  if (!c.id) throw new Error('Conta financeira sem id não pode ser atualizada.');
  const { data, error } = await supabase
    .from('contas_financeiras')
    .update({ tipo: c.tipo, instituicao: c.instituicao, empresa_id: c.empresaId, ativo: c.ativo })
    .eq('id', c.id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaConta(data as LinhaContaFinanceira);
}

/** Cria se a conta ainda não tem id, ou atualiza caso já exista. */
export async function salvarContaFinanceira(c: ContaFinanceira): Promise<ContaFinanceira> {
  return c.id ? atualizarContaFinanceira(c) : criarContaFinanceira(c);
}

/** Desativa/reativa em vez de excluir — pode já ter lançamentos vinculados. */
export async function definirAtivaContaFinanceira(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from('contas_financeiras').update({ ativo }).eq('id', id);
  if (error) throw error;
}

/**
 * Exclui de verdade — só funciona se esta conta NUNCA foi usada num
 * lançamento (senão o banco recusa: financeiro.conta_financeira_id
 * referencia esta linha). Quem chama deve tratar esse caso (código '23503',
 * violação de chave estrangeira) sugerindo "Desativar" em vez de excluir.
 */
export async function excluirContaFinanceira(id: string): Promise<void> {
  const { error } = await supabase.from('contas_financeiras').delete().eq('id', id);
  if (error) throw error;
}

export { ehViolacaoDeReferencia } from '@/shared/utils/erros';
