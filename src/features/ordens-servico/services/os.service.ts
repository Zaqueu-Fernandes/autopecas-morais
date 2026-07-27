/**
 * ============================================================================
 * ACESSO AO BANCO — ORDENS DE SERVIÇO
 * ============================================================================
 * Único lugar que fala com a tabela `ordens_servico`. Componentes usam essas
 * funções, nunca o Supabase direto (ver regra em CLAUDE.md).
 */

import { supabase } from '@/lib/supabase';
import { type OrdemServico, type OrdemServicoResumo, type StatusOS, PROXIMO_STATUS } from '../types';

interface LinhaOS {
  id: string;
  numero: number;
  cliente_id: string;
  veiculo_id: string;
  status: StatusOS;
  descricao_problema: string | null;
  observacoes: string | null;
  data_abertura: string;
  data_conclusao: string | null;
}

function linhaParaOS(l: LinhaOS): OrdemServico {
  return {
    id: l.id,
    numero: l.numero,
    clienteId: l.cliente_id,
    veiculoId: l.veiculo_id,
    status: l.status,
    descricaoProblema: l.descricao_problema ?? '',
    observacoes: l.observacoes ?? '',
    dataAbertura: l.data_abertura,
    dataConclusao: l.data_conclusao,
  };
}

interface LinhaOSComJoins extends LinhaOS {
  clientes: { nome: string } | null;
  veiculos: { placa: string; marca: string | null; modelo: string | null } | null;
}

function linhaParaResumo(l: LinhaOSComJoins): OrdemServicoResumo {
  return {
    ...linhaParaOS(l),
    clienteNome: l.clientes?.nome ?? '—',
    veiculoPlaca: l.veiculos?.placa ?? '—',
    veiculoMarcaModelo: [l.veiculos?.marca, l.veiculos?.modelo].filter(Boolean).join(' '),
  };
}

/** Lista OS mais recentes primeiro, com nome do cliente e dados do veículo. */
export async function listarOS(opts: { status?: StatusOS } = {}): Promise<OrdemServicoResumo[]> {
  let query = supabase
    .from('ordens_servico')
    .select('*, clientes(nome), veiculos(placa, marca, modelo)')
    .order('numero', { ascending: false });
  if (opts.status) query = query.eq('status', opts.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data as LinhaOSComJoins[]).map(linhaParaResumo);
}

export async function buscarOSPorId(id: string): Promise<OrdemServicoResumo> {
  const { data, error } = await supabase
    .from('ordens_servico')
    .select('*, clientes(nome), veiculos(placa, marca, modelo)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return linhaParaResumo(data as LinhaOSComJoins);
}

export async function criarOS(os: OrdemServico): Promise<OrdemServico> {
  const { data, error } = await supabase
    .from('ordens_servico')
    .insert({
      cliente_id: os.clienteId,
      veiculo_id: os.veiculoId,
      descricao_problema: os.descricaoProblema || null,
      observacoes: os.observacoes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return linhaParaOS(data as LinhaOS);
}

/** Avança para o próximo status linear (aberta → em_andamento → concluida). */
export async function avancarStatusOS(id: string, statusAtual: StatusOS): Promise<OrdemServico> {
  const proximo = PROXIMO_STATUS[statusAtual];
  if (!proximo) throw new Error('Esta OS já está no último status disponível nesta tela.');

  const patch: Record<string, unknown> = { status: proximo };
  if (proximo === 'concluida') patch.data_conclusao = new Date().toISOString();

  const { data, error } = await supabase
    .from('ordens_servico')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return linhaParaOS(data as LinhaOS);
}
