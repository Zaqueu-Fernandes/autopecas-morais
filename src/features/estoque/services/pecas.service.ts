/**
 * ============================================================================
 * ACESSO AO BANCO — PEÇAS
 * ============================================================================
 * Único lugar que fala com a tabela `pecas`. Componentes usam essas funções,
 * nunca o Supabase direto (ver regra em CLAUDE.md).
 *
 * IMPORTANTE: qtd e preco_custo NUNCA entram nos payloads de criar/atualizar —
 * esses campos só mudam via trigger, a partir de movimentacao_estoque.
 */

import { supabase } from '@/lib/supabase';
import type { Peca } from '../types';
import { registrarEntrada } from './movimentacao.service';
import { paraNumero } from '@/shared/utils/formatadores';

interface LinhaPeca {
  id: string;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  unidade: string;
  categoria: string | null;
  preco_custo: number;
  preco_venda: number;
  estoque_minimo: number;
  qtd: number;
  ativo: boolean;
  observacoes: string | null;
}

function linhaParaPeca(l: LinhaPeca): Peca {
  return {
    id: l.id,
    codigo: l.codigo ?? '',
    nome: l.nome,
    descricao: l.descricao ?? '',
    unidade: l.unidade,
    categoria: l.categoria ?? '',
    precoVenda: String(l.preco_venda),
    estoqueMinimo: String(l.estoque_minimo),
    ativo: l.ativo,
    observacoes: l.observacoes ?? '',
    precoCusto: Number(l.preco_custo),
    qtd: l.qtd,
  };
}

/** Payload de criação/edição — de propósito NÃO inclui qtd nem preco_custo. */
function pecaParaLinha(p: Peca) {
  return {
    codigo: p.codigo || null,
    nome: p.nome,
    descricao: p.descricao || null,
    unidade: p.unidade || 'un',
    categoria: p.categoria || null,
    preco_venda: p.precoVenda.trim() ? paraNumero(p.precoVenda) : 0,
    estoque_minimo: p.estoqueMinimo.trim() ? paraNumero(p.estoqueMinimo) : 0,
    ativo: p.ativo,
    observacoes: p.observacoes || null,
  };
}

/** Lista peças. Por padrão só as ativas; `busca` filtra por nome ou código. */
export async function listarPecas(opts: { busca?: string; somenteAtivas?: boolean } = {}): Promise<Peca[]> {
  const { busca, somenteAtivas = true } = opts;
  let query = supabase.from('pecas').select('*').order('nome');
  if (somenteAtivas) query = query.eq('ativo', true);
  if (busca?.trim()) query = query.or(`nome.ilike.%${busca.trim()}%,codigo.ilike.%${busca.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaPeca[]).map(linhaParaPeca);
}

export async function criarPeca(peca: Peca): Promise<Peca> {
  const { data, error } = await supabase
    .from('pecas')
    .insert(pecaParaLinha(peca))
    .select()
    .single();
  if (error) throw error;
  return linhaParaPeca(data as LinhaPeca);
}

export async function atualizarPeca(peca: Peca): Promise<Peca> {
  if (!peca.id) throw new Error('Peça sem id não pode ser atualizada.');
  const { data, error } = await supabase
    .from('pecas')
    .update(pecaParaLinha(peca))
    .eq('id', peca.id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaPeca(data as LinhaPeca);
}

/**
 * Cria a peça e, se um estoque inicial foi informado no formulário, registra
 * a primeira ENTRADA imediatamente — sem isso, o usuário teria que criar a
 * peça e só depois ir numa segunda tela lançar a entrada.
 */
async function criarPecaComEstoqueInicial(peca: Peca): Promise<Peca> {
  const nova = await criarPeca(peca);

  const qtdInicial = paraNumero(peca.qtdInicial ?? '');
  if (!peca.qtdInicial?.trim() || Number.isNaN(qtdInicial) || qtdInicial <= 0) {
    return nova;
  }

  const custoInicial = peca.custoInicial?.trim() ? paraNumero(peca.custoInicial) : 0;
  await registrarEntrada({
    pecaId: nova.id!,
    quantidade: qtdInicial,
    custoUnit: custoInicial,
    fornecedorId: peca.fornecedorIdInicial,
    empresaId: peca.empresaIdInicial,
    observacoes: 'Estoque inicial (cadastro da peça)',
  });

  return { ...nova, qtd: qtdInicial, precoCusto: custoInicial };
}

/** Cria se a peça ainda não tem id, ou atualiza caso já exista. */
export async function salvarPeca(peca: Peca): Promise<Peca> {
  return peca.id ? atualizarPeca(peca) : criarPecaComEstoqueInicial(peca);
}

/** Desativa/reativa em vez de excluir — peça pode ter histórico de movimentação. */
export async function definirAtivoPeca(id: string, ativo: boolean): Promise<void> {
  const { error } = await supabase.from('pecas').update({ ativo }).eq('id', id);
  if (error) throw error;
}

export interface PecaEstoqueBaixo {
  id: string;
  nome: string;
  codigo: string | null;
  unidade: string;
  qtd: number;
  estoqueMinimo: number;
}

/**
 * Peças ativas com saldo no mínimo configurado ou abaixo dele. SEM parâmetro
 * de empresa — estoque é compartilhado entre empresas (não tem empresa_id em
 * `pecas`, ver CLAUDE.md). Só entram peças com estoque_minimo > 0 (0 =
 * monitoramento desligado pra aquela peça). Usado no card do Dashboard e
 * pra pré-popular o fluxo de Fazer Pedido ao Fornecedor.
 */
export async function buscarPecasEstoqueBaixo(): Promise<PecaEstoqueBaixo[]> {
  const { data, error } = await supabase
    .from('pecas')
    .select('id, nome, codigo, unidade, qtd, estoque_minimo')
    .eq('ativo', true)
    .gt('estoque_minimo', 0)
    .order('qtd', { ascending: true });
  if (error) throw error;

  return (data ?? [])
    .filter((p) => p.qtd <= p.estoque_minimo)
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      codigo: p.codigo,
      unidade: p.unidade,
      qtd: p.qtd,
      estoqueMinimo: p.estoque_minimo,
    }));
}
