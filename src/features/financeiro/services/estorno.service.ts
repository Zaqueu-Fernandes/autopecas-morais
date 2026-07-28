/**
 * ============================================================================
 * ESTORNO DE LANÇAMENTO
 * ============================================================================
 * Cancela o efeito de um lançamento já quitado ou vinculado a OS/venda, sem
 * apagar rastro. Duas partes:
 *   1. Marca o lançamento ORIGINAL como estornado (preservado, mas some das
 *      contas de faturamento/pendências — ver dashboard.service.ts).
 *   2. Se ele já estava pago/recebido, gera uma CONTRAPARTIDA: um lançamento
 *      novo, tipo invertido, categoria 'estorno', mesmo valor — representa o
 *      dinheiro saindo/voltando de verdade agora. Lançamento pendente nunca
 *      teve dinheiro trocando de mãos, então não gera contrapartida.
 * Se o original vem de uma OS faturada ou venda finalizada, destrava as duas
 * pra edição de novo (mesma exceção de faturamento.service.ts/venda.service.ts:
 * financeiro atualiza só o campo status dessas tabelas, direto, sem importar
 * código de lá).
 *
 * NÃO cobre devolução de peça (estoque voltando fisicamente) — isso é uma
 * ENTRADA de estoque separada (origem 'devolucao_cliente', ainda não
 * implementada), que reaproveitaria este estorno pro lado financeiro.
 */

import { supabase } from '@/lib/supabase';
import { criarLancamento, marcarLancamentoEstornado, buscarLancamento } from './financeiro.service';
import type { DadosEstorno, LancamentoFinanceiro, TipoFinanceiro } from '../types';

function tipoInvertido(tipo: TipoFinanceiro): TipoFinanceiro {
  return tipo === 'pagar' ? 'receber' : 'pagar';
}

export async function estornarLancamento(id: string, dados: DadosEstorno): Promise<void> {
  const original = await buscarLancamento(id);
  if (original.estornado) throw new Error('Este lançamento já foi estornado.');

  await marcarLancamentoEstornado(id, dados.motivo);

  if (original.pago) {
    if (!dados.formaPagamento) throw new Error('Selecione como o dinheiro está sendo devolvido.');
    const contrapartida: LancamentoFinanceiro = {
      empresaId: original.empresaId,
      tipo: tipoInvertido(original.tipo),
      categoria: 'estorno',
      descricao: `Estorno — ${original.descricao}`,
      valor: original.valor,
      pago: true,
      formaPagamento: dados.formaPagamento,
      dataPagamento: new Date().toISOString(),
      vencimento: null,
      clienteId: original.clienteId,
      fornecedorId: null,
      osId: null,
      vendaId: null,
      despesaFixaId: null,
      periodicidade: null,
      estornoDeId: id,
      observacoes: dados.motivo,
    };
    await criarLancamento(contrapartida);
  }

  if (original.osId) {
    const { error } = await supabase.from('ordens_servico').update({ status: 'concluida' }).eq('id', original.osId);
    if (error) throw error;
  }
  if (original.vendaId) {
    const { error } = await supabase.from('vendas_balcao').update({ status: 'aberta' }).eq('id', original.vendaId);
    if (error) throw error;
  }
}
