/**
 * ============================================================================
 * ACESSO AO BANCO — OCULTAÇÃO DE LANÇAMENTO POR USUÁRIO
 * ============================================================================
 * Único lugar que fala com `financeiro_ocultacoes` (ver
 * financeiro_ocultar_dinheiro.sql). Guarda, por lançamento, PRA QUAIS
 * usuários ele deve ficar invisível (listas, somatórios, relatórios) — o
 * admin decide isso lançamento a lançamento, podendo inclusive incluir a si
 * mesmo. A trava de quem pode ESCREVER aqui é a RLS (só admin); leitura é
 * liberada pro próprio usuário ver o que está oculto pra ele.
 */

import { supabase } from '@/lib/supabase';

interface LinhaOcultacao {
  financeiro_id: string;
  usuario_id: string;
}

/**
 * ids de lançamento ocultos PRA este usuário — usado por toda tela/serviço
 * que soma ou lista financeiro (Dashboard, Fluxo de Caixa, Financeiro), pra
 * cada usuário ver os totais sem o que foi ocultado especificamente pra ele.
 */
export async function buscarIdsOcultosParaUsuario(usuarioId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('financeiro_ocultacoes')
    .select('financeiro_id')
    .eq('usuario_id', usuarioId);
  if (error) throw error;
  return new Set((data as LinhaOcultacao[]).map((l) => l.financeiro_id));
}

/**
 * Mapa financeiro_id -> lista de usuario_id pra quem está oculto — usado só
 * pela tela de Financeiro (admin) pra mostrar "oculto pra N usuário(s)" e
 * pré-marcar o formulário de visibilidade, sem precisar de uma consulta por
 * linha. RLS só deixa admin ver TODAS as linhas (não só as próprias).
 */
export async function buscarTodasOcultacoes(): Promise<Record<string, string[]>> {
  const { data, error } = await supabase.from('financeiro_ocultacoes').select('financeiro_id, usuario_id');
  if (error) throw error;
  const mapa: Record<string, string[]> = {};
  for (const linha of data as LinhaOcultacao[]) {
    (mapa[linha.financeiro_id] ??= []).push(linha.usuario_id);
  }
  return mapa;
}

/**
 * Substitui de uma vez o conjunto de usuários pra quem este lançamento fica
 * oculto: quem não está mais em `usuarioIds` volta a ver o lançamento; quem
 * foi incluído passa a não ver mais. Validação de "só entrada em dinheiro"
 * fica em definirVisibilidadeLancamento (financeiro.service.ts) — este
 * service é só o acesso cru à tabela de ocultações.
 */
export async function definirUsuariosQueOcultam(financeiroId: string, usuarioIds: string[]): Promise<void> {
  const { error: erroExcluir } = await supabase
    .from('financeiro_ocultacoes')
    .delete()
    .eq('financeiro_id', financeiroId);
  if (erroExcluir) throw erroExcluir;

  if (usuarioIds.length === 0) return;

  const { error: erroInserir } = await supabase
    .from('financeiro_ocultacoes')
    .insert(usuarioIds.map((usuarioId) => ({ financeiro_id: financeiroId, usuario_id: usuarioId })));
  if (erroInserir) throw erroInserir;
}
