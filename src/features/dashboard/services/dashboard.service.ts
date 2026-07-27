/**
 * ============================================================================
 * RESUMO DO DASHBOARD
 * ============================================================================
 * Lê direto de `financeiro` (mesma tabela da feature financeiro) e agrega em
 * memória — volume de uma oficina pequena não justifica agregação no banco.
 * Faturamento é contado por created_at (data em que a OS/venda foi faturada),
 * não por data de pagamento: o fato gerador é a venda, não o recebimento.
 * Despesa do mês é contada por vencimento (a conta pertence àquele mês),
 * independente de já ter sido paga.
 */

import { supabase } from '@/lib/supabase';

export interface ResumoDashboard {
  faturamentoMes: number;
  faturamentoAno: number;
  despesasMes: number;
  /** faturamentoMes - despesasMes. Negativo = mês no vermelho (aviso, não bloqueio). */
  resultadoMes: number;
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
  const inicioMesData = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().slice(0, 10);
  const fimMesData = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString().slice(0, 10);

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

  const { data: despesasDoMes, error: erroDespesasMes } = await supabase
    .from('financeiro')
    .select('valor')
    .eq('tipo', 'pagar')
    .gte('vencimento', inicioMesData)
    .lte('vencimento', fimMesData);
  if (erroDespesasMes) throw erroDespesasMes;
  const despesasMes = (despesasDoMes ?? []).reduce((soma, r) => soma + Number(r.valor), 0);

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
    despesasMes,
    resultadoMes: faturamentoMes - despesasMes,
    aReceberPendente,
    aPagarPendente,
    aPagarVencidoValor,
    aPagarVencidoQtd: vencidos.length,
  };
}
