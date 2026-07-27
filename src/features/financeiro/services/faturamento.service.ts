/**
 * ============================================================================
 * FATURAMENTO DE OS
 * ============================================================================
 * Ao faturar: cria o lançamento em financeiro (tipo='receber') conforme a
 * situação de recebimento, e trava a OS (status='faturada'). As duas coisas
 * não são transacionais (sem RPC no banco ainda) — se a segunda falhar, fica
 * um lançamento financeiro órfão de uma OS não travada; aceitável pro estágio
 * atual (uso único, correção manual), revisar se isso virar problema real.
 *
 * Esta é a ÚNICA função que atualiza ordens_servico a partir da feature
 * financeiro — só o campo status, só nesta direção (financeiro depende de
 * ordens-servico só por convenção de nome de tabela, não importa código de lá).
 */

import { supabase } from '@/lib/supabase';
import { criarLancamento } from './financeiro.service';
import type { DadosFaturamento } from '../types';

export async function faturarOS(input: {
  osId: string;
  clienteId: string;
  valorTotal: number;
  dados: DadosFaturamento;
}): Promise<void> {
  const { osId, clienteId, valorTotal, dados } = input;

  const base = {
    empresaId: dados.empresaId,
    tipo: 'receber' as const,
    categoria: 'servico_os' as const,
    descricao: `Faturamento da OS`,
    valor: valorTotal,
    clienteId,
    fornecedorId: null,
    osId,
    vendaId: null,
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

  const { error } = await supabase.from('ordens_servico').update({ status: 'faturada' }).eq('id', osId);
  if (error) throw error;
}
