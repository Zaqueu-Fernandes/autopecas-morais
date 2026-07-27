/**
 * ============================================================================
 * RESUMO DO DASHBOARD
 * ============================================================================
 * Lê direto de `financeiro` (mesma tabela da feature financeiro) e agrega em
 * memória — volume de uma oficina pequena não justifica agregação no banco.
 * Faturamento é contado por created_at (data em que a OS/venda foi faturada),
 * não por data de pagamento: o fato gerador é a venda, não o recebimento.
 */

import { supabase } from '@/lib/supabase';

export interface ResumoDashboard {
  faturamentoMes: number;
  faturamentoAno: number;
  aReceberPendente: number;
  aPagarPendente: number;
  aPagarVencidoValor: number;
  aPagarVencidoQtd: number;
}

export async function buscarResumoDashboard(): Promise<ResumoDashboard> {
  const agora = new Date();
  const inicioAno = new Date(agora.getFullYear(), 0, 1).toISOString();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
  const hojeISO = new Date().toISOString().slice(0, 10);

  const { data: receitasAno, error: erroReceitas } = await supabase
    .from('financeiro')
    .select('valor, created_at')
    .eq('tipo', 'receber')
    .in('categoria', ['servico_os', 'venda_balcao'])
    .gte('created_at', inicioAno);
  if (erroReceitas) throw erroReceitas;

  const faturamentoAno = (receitasAno ?? []).reduce((soma, r) => soma + Number(r.valor), 0);
  const faturamentoMes = (receitasAno ?? [])
    .filter((r) => r.created_at >= inicioMes)
    .reduce((soma, r) => soma + Number(r.valor), 0);

  const { data: receberPendente, error: erroReceber } = await supabase
    .from('financeiro')
    .select('valor')
    .eq('tipo', 'receber')
    .eq('pago', false);
  if (erroReceber) throw erroReceber;
  const aReceberPendente = (receberPendente ?? []).reduce((soma, r) => soma + Number(r.valor), 0);

  const { data: pagarPendente, error: erroPagar } = await supabase
    .from('financeiro')
    .select('valor, vencimento')
    .eq('tipo', 'pagar')
    .eq('pago', false);
  if (erroPagar) throw erroPagar;

  const aPagarPendente = (pagarPendente ?? []).reduce((soma, r) => soma + Number(r.valor), 0);
  const vencidos = (pagarPendente ?? []).filter((r) => r.vencimento && r.vencimento < hojeISO);
  const aPagarVencidoValor = vencidos.reduce((soma, r) => soma + Number(r.valor), 0);

  return {
    faturamentoMes,
    faturamentoAno,
    aReceberPendente,
    aPagarPendente,
    aPagarVencidoValor,
    aPagarVencidoQtd: vencidos.length,
  };
}
