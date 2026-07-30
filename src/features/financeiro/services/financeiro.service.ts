/**
 * ============================================================================
 * ACESSO AO BANCO — FINANCEIRO
 * ============================================================================
 * Único lugar que fala com a tabela `financeiro`. Componentes usam essas
 * funções, nunca o Supabase direto (ver regra em CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';
import type { LancamentoFinanceiro, TipoFinanceiro, FormaPagamento } from '../types';

interface LinhaFinanceiro {
  id: string;
  empresa_id: string | null;
  tipo: TipoFinanceiro;
  categoria: string;
  descricao: string;
  valor: number;
  pago: boolean;
  forma_pagamento: FormaPagamento | null;
  conta_financeira_id: string | null;
  data_pagamento: string | null;
  vencimento: string | null;
  cliente_id: string | null;
  fornecedor_id: string | null;
  credor_id: string | null;
  os_id: string | null;
  venda_id: string | null;
  despesa_fixa_id: string | null;
  periodicidade: LancamentoFinanceiro['periodicidade'];
  estornado: boolean;
  estornado_em: string | null;
  estornado_motivo: string | null;
  estorno_de_id: string | null;
  observacoes: string | null;
  created_at: string;
}

function linhaParaLancamento(l: LinhaFinanceiro): LancamentoFinanceiro {
  return {
    id: l.id,
    empresaId: l.empresa_id,
    tipo: l.tipo,
    categoria: l.categoria as LancamentoFinanceiro['categoria'],
    descricao: l.descricao,
    valor: Number(l.valor),
    pago: l.pago,
    formaPagamento: l.forma_pagamento,
    contaFinanceiraId: l.conta_financeira_id,
    dataPagamento: l.data_pagamento,
    vencimento: l.vencimento,
    clienteId: l.cliente_id,
    fornecedorId: l.fornecedor_id,
    credorId: l.credor_id,
    osId: l.os_id,
    vendaId: l.venda_id,
    despesaFixaId: l.despesa_fixa_id,
    periodicidade: l.periodicidade,
    estornado: l.estornado,
    estornadoEm: l.estornado_em,
    estornadoMotivo: l.estornado_motivo,
    estornoDeId: l.estorno_de_id,
    observacoes: l.observacoes ?? '',
    createdAt: l.created_at,
  };
}

/** Lista lançamentos, mais recentes primeiro. Filtros opcionais por tipo/pago/empresa. */
export async function listarFinanceiro(
  opts: { tipo?: TipoFinanceiro; pago?: boolean; empresaId?: string } = {},
): Promise<LancamentoFinanceiro[]> {
  let query = supabase.from('financeiro').select('*').order('vencimento', { ascending: true, nullsFirst: false });
  if (opts.tipo) query = query.eq('tipo', opts.tipo);
  if (opts.pago !== undefined) query = query.eq('pago', opts.pago);
  if (opts.empresaId) query = query.eq('empresa_id', opts.empresaId);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaFinanceiro[]).map(linhaParaLancamento);
}

export async function criarLancamento(l: LancamentoFinanceiro): Promise<LancamentoFinanceiro> {
  const { data, error } = await supabase
    .from('financeiro')
    .insert({
      empresa_id: l.empresaId,
      tipo: l.tipo,
      categoria: l.categoria,
      descricao: l.descricao,
      valor: l.valor,
      pago: l.pago,
      forma_pagamento: l.formaPagamento,
      conta_financeira_id: l.contaFinanceiraId,
      data_pagamento: l.dataPagamento,
      vencimento: l.vencimento,
      cliente_id: l.clienteId,
      fornecedor_id: l.fornecedorId,
      credor_id: l.credorId ?? null,
      os_id: l.osId,
      venda_id: l.vendaId,
      despesa_fixa_id: l.despesaFixaId,
      periodicidade: l.periodicidade,
      estorno_de_id: l.estornoDeId ?? null,
      observacoes: l.observacoes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return linhaParaLancamento(data as LinhaFinanceiro);
}

/**
 * Corrige o valor de um lançamento ainda pendente — pra ajustar despesas de
 * valor variável (água, luz...) pro valor real da conta antes de quitar.
 * Só faz sentido em lançamentos não pagos (histórico já quitado não muda).
 */
export async function atualizarValorLancamento(id: string, valor: number): Promise<LancamentoFinanceiro> {
  const { data, error } = await supabase
    .from('financeiro')
    .update({ valor })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaLancamento(data as LinhaFinanceiro);
}

/**
 * Marca um lançamento como quitado (pago ou recebido, conforme o tipo).
 * `empresaId` só precisa ser passado quando o lançamento ainda não tinha uma
 * (veio de despesa recorrente global, ver DespesaFixa) — nos demais casos o
 * lançamento já nasceu com empresa definida e este parâmetro é ignorado.
 */
export async function quitarLancamento(
  id: string,
  formaPagamento: FormaPagamento,
  contaFinanceiraId: string,
  empresaId?: string,
): Promise<LancamentoFinanceiro> {
  const patch: Record<string, unknown> = {
    pago: true,
    forma_pagamento: formaPagamento,
    conta_financeira_id: contaFinanceiraId,
    data_pagamento: new Date().toISOString(),
  };
  if (empresaId) patch.empresa_id = empresaId;

  const { data, error } = await supabase
    .from('financeiro')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaLancamento(data as LinhaFinanceiro);
}

export async function buscarLancamento(id: string): Promise<LancamentoFinanceiro> {
  const { data, error } = await supabase.from('financeiro').select('*').eq('id', id).single();
  if (error) throw error;
  return linhaParaLancamento(data as LinhaFinanceiro);
}

/**
 * O lançamento de faturamento ainda válido (não estornado) de uma OS/venda —
 * usado pela devolução de item (ordens-servico/vendas) pra saber se o
 * faturamento já foi pago (gera reembolso) ou ainda tá pendente (só reduz o
 * valor a receber). null se a OS/venda nunca foi faturada ou já foi
 * totalmente estornada.
 */
export async function buscarLancamentoDeOS(osId: string): Promise<LancamentoFinanceiro | null> {
  const { data, error } = await supabase
    .from('financeiro')
    .select('*')
    .eq('os_id', osId)
    .eq('estornado', false)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  const linha = (data as LinhaFinanceiro[])[0];
  return linha ? linhaParaLancamento(linha) : null;
}

export async function buscarLancamentoDeVenda(vendaId: string): Promise<LancamentoFinanceiro | null> {
  const { data, error } = await supabase
    .from('financeiro')
    .select('*')
    .eq('venda_id', vendaId)
    .eq('estornado', false)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  const linha = (data as LinhaFinanceiro[])[0];
  return linha ? linhaParaLancamento(linha) : null;
}

/**
 * Exclui de verdade — só permitido pra lançamento ainda PENDENTE (pago=false)
 * e sem vínculo com OS/venda (osId/vendaId nulos). Lançamento já quitado ou
 * vinculado a OS/venda faturada tem rastro de dinheiro real e trava de status
 * pra desfazer — usa estornarLancamento (estorno.service.ts) em vez disso.
 * Valida aqui (não só escondendo o botão na tela) pra não depender só da UI.
 */
export async function excluirLancamento(id: string): Promise<void> {
  const lancamento = await buscarLancamento(id);
  if (lancamento.pago) {
    throw new Error('Este lançamento já foi quitado — não dá pra excluir, só estornar.');
  }
  if (lancamento.osId || lancamento.vendaId) {
    throw new Error('Este lançamento está vinculado a uma OS/venda — não dá pra excluir, só estornar.');
  }
  const { error } = await supabase.from('financeiro').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Marca o lançamento ORIGINAL como estornado — usado por estorno.service.ts,
 * que decide se precisa gerar uma contrapartida (se já estava pago) e se
 * precisa destravar a OS/venda vinculada. Fica aqui porque é a única função
 * do módulo que grava direto na tabela financeiro (ver header do arquivo).
 */
export async function marcarLancamentoEstornado(id: string, motivo: string): Promise<void> {
  const { error } = await supabase
    .from('financeiro')
    .update({ estornado: true, estornado_em: new Date().toISOString(), estornado_motivo: motivo })
    .eq('id', id);
  if (error) throw error;
}
