/**
 * ============================================================================
 * FINALIZAÇÃO DE VENDA DE BALCÃO
 * ============================================================================
 * Espelha faturamento.service.ts (OS), mas pra vendas_balcao: cria o
 * lançamento em financeiro (categoria='venda_balcao') e trava a venda
 * (status='finalizada'). a_prazo/fiado exigem cliente_id (validado no
 * componente, não aqui — ver FormFinalizarVenda).
 */

import { supabase } from '@/lib/supabase';
import { criarLancamento } from './financeiro.service';
import type { DadosFaturamento } from '../types';

export async function finalizarVenda(input: {
  vendaId: string;
  clienteId: string | null;
  valorTotal: number;
  dados: DadosFaturamento;
}): Promise<void> {
  const { vendaId, clienteId, valorTotal, dados } = input;

  const base = {
    tipo: 'receber' as const,
    categoria: 'venda_balcao' as const,
    descricao: `Venda de balcão`,
    valor: valorTotal,
    clienteId,
    fornecedorId: null,
    osId: null,
    vendaId,
    despesaFixaId: null,
    observacoes: '',
  };

  if (dados.situacao === 'a_vista') {
    await criarLancamento({
      ...base,
      pago: true,
      formaPagamento: dados.formaPagamento || null,
      dataPagamento: new Date().toISOString(),
      vencimento: null,
    });
  } else if (dados.situacao === 'a_prazo') {
    await criarLancamento({
      ...base,
      pago: false,
      formaPagamento: null,
      dataPagamento: null,
      vencimento: dados.vencimento,
    });
  } else {
    await criarLancamento({
      ...base,
      pago: false,
      formaPagamento: null,
      dataPagamento: null,
      vencimento: null,
    });
  }

  const { error } = await supabase.from('vendas_balcao').update({ status: 'finalizada' }).eq('id', vendaId);
  if (error) throw error;
}
