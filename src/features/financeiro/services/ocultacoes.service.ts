/**
 * ============================================================================
 * ACESSO AO BANCO — OCULTAÇÃO DE LANÇAMENTO POR USUÁRIO
 * ============================================================================
 * Único lugar que fala com `financeiro_ocultacoes` (ver
 * financeiro_ocultar_dinheiro.sql). Guarda, por lançamento, PRA QUAIS
 * usuários ele deve ficar invisível (listas, somatórios, relatórios). Quem
 * gerencia isso é o painel admin "Ocultar Pagamentos em Dinheiro" (ver
 * OcultarDinheiroPage.tsx), em lote por período — não mais lançamento a
 * lançamento. A trava de quem pode ESCREVER aqui é a RLS (só admin);
 * leitura é liberada pro próprio usuário ver o que está oculto pra ele.
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
 * Mapa financeiro_id -> lista de usuario_id pra quem está oculto — usado
 * pela tela de Financeiro (admin) pra mostrar "oculto pra N usuário(s)" e
 * pelo painel "Ocultar Pagamentos em Dinheiro" pra saber o estado atual
 * antes de deixar o admin marcar/desmarcar em lote. RLS só deixa admin ver
 * TODAS as linhas (não só as próprias).
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
 * Aplica em lote, pros `usuarioIds` escolhidos no painel: os lançamentos em
 * `financeiroIdsOcultar` passam a ficar ocultos pra eles (se já não
 * estivessem), e os lançamentos em `financeiroIdsMostrar` voltam a ficar
 * visíveis pra eles (se estivessem ocultos). Só mexe nos usuários e
 * lançamentos passados — não toca em ocultações de outros usuários nem de
 * lançamentos fora do período filtrado na tela.
 */
export async function sincronizarOcultacoesEmLote(
  usuarioIds: string[],
  financeiroIdsOcultar: string[],
  financeiroIdsMostrar: string[],
): Promise<void> {
  if (usuarioIds.length === 0) return;

  if (financeiroIdsMostrar.length > 0) {
    const { error } = await supabase
      .from('financeiro_ocultacoes')
      .delete()
      .in('usuario_id', usuarioIds)
      .in('financeiro_id', financeiroIdsMostrar);
    if (error) throw error;
  }

  if (financeiroIdsOcultar.length > 0) {
    const linhas = financeiroIdsOcultar.flatMap((financeiroId) =>
      usuarioIds.map((usuarioId) => ({ financeiro_id: financeiroId, usuario_id: usuarioId })),
    );
    // upsert com ignoreDuplicates: alguns pares já podem existir (lançamento
    // já estava oculto pra esse usuário) — só insere os que faltam, sem
    // precisar de um delete prévio (chave primária composta cuida disso).
    const { error } = await supabase
      .from('financeiro_ocultacoes')
      .upsert(linhas, { onConflict: 'financeiro_id,usuario_id', ignoreDuplicates: true });
    if (error) throw error;
  }
}
