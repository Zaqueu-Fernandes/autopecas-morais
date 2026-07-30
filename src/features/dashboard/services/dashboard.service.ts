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
 *
 * `empresaId` filtra tudo por uma empresa (CNPJ) só — o financeiro é
 * separado por empresa justamente pra dar pra monitorar o limite do MEI de
 * cada CNPJ individualmente (ver CLAUDE.md).
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
  /**
   * Soma de quantidade × custo_unit das ENTRADAS de estoque do ano corrente
   * (compra de peças) — não é despesa financeira, é o valor gasto compondo
   * estoque. Serve de alerta antecipado do limite do MEI: venda = custo +
   * margem, então se o custo sozinho já está perto do limite anual, o
   * faturamento (que inclui a margem em cima disso) vai passar do limite
   * ainda mais rápido. Só conta movimentações com empresa_id preenchido —
   * entradas registradas antes dessa feature existir ficam de fora (não dá
   * pra saber de qual CNPJ era a nota).
   */
  custoAquisicaoAno: number;
}

export async function buscarResumoDashboard(empresaId?: string): Promise<ResumoDashboard> {
  const agora = new Date();
  const inicioAno = new Date(agora.getFullYear(), 0, 1).toISOString();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
  const hojeISO = new Date().toISOString().slice(0, 10);
  const inicioMesData = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString().slice(0, 10);
  const fimMesData = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString().slice(0, 10);

  let queryReceitas = supabase
    .from('financeiro')
    .select('valor, created_at')
    .eq('tipo', 'receber')
    .eq('estornado', false)
    .in('categoria', ['servico_os', 'venda_balcao'])
    .gte('created_at', inicioAno);
  if (empresaId) queryReceitas = queryReceitas.eq('empresa_id', empresaId);
  const { data: receitasAno, error: erroReceitas } = await queryReceitas;
  if (erroReceitas) throw erroReceitas;

  const faturamentoAno = (receitasAno ?? []).reduce((soma, r) => soma + Number(r.valor), 0);
  const faturamentoMes = (receitasAno ?? [])
    .filter((r) => r.created_at >= inicioMes)
    .reduce((soma, r) => soma + Number(r.valor), 0);

  let queryDespesasMes = supabase
    .from('financeiro')
    .select('valor')
    .eq('tipo', 'pagar')
    .eq('estornado', false)
    .gte('vencimento', inicioMesData)
    .lte('vencimento', fimMesData);
  if (empresaId) queryDespesasMes = queryDespesasMes.eq('empresa_id', empresaId);
  const { data: despesasDoMes, error: erroDespesasMes } = await queryDespesasMes;
  if (erroDespesasMes) throw erroDespesasMes;
  const despesasMes = (despesasDoMes ?? []).reduce((soma, r) => soma + Number(r.valor), 0);

  let queryReceber = supabase
    .from('financeiro')
    .select('valor')
    .eq('tipo', 'receber')
    .eq('pago', false)
    .eq('estornado', false);
  if (empresaId) queryReceber = queryReceber.eq('empresa_id', empresaId);
  const { data: receberPendente, error: erroReceber } = await queryReceber;
  if (erroReceber) throw erroReceber;
  const aReceberPendente = (receberPendente ?? []).reduce((soma, r) => soma + Number(r.valor), 0);

  let queryPagar = supabase
    .from('financeiro')
    .select('valor, vencimento')
    .eq('tipo', 'pagar')
    .eq('pago', false)
    .eq('estornado', false);
  if (empresaId) queryPagar = queryPagar.eq('empresa_id', empresaId);
  const { data: pagarPendente, error: erroPagar } = await queryPagar;
  if (erroPagar) throw erroPagar;

  const aPagarPendente = (pagarPendente ?? []).reduce((soma, r) => soma + Number(r.valor), 0);
  const vencidos = (pagarPendente ?? []).filter((r) => r.vencimento && r.vencimento < hojeISO);
  const aPagarVencidoValor = vencidos.reduce((soma, r) => soma + Number(r.valor), 0);

  let queryEntradasAno = supabase
    .from('movimentacao_estoque')
    .select('quantidade, custo_unit')
    .eq('tipo', 'entrada')
    .gte('created_at', inicioAno);
  if (empresaId) queryEntradasAno = queryEntradasAno.eq('empresa_id', empresaId);
  const { data: entradasAno, error: erroEntradas } = await queryEntradasAno;
  if (erroEntradas) throw erroEntradas;
  const custoAquisicaoAno = (entradasAno ?? []).reduce(
    (soma, e) => soma + Number(e.quantidade) * Number(e.custo_unit ?? 0),
    0,
  );

  return {
    faturamentoMes,
    faturamentoAno,
    despesasMes,
    resultadoMes: faturamentoMes - despesasMes,
    aReceberPendente,
    aPagarPendente,
    aPagarVencidoValor,
    aPagarVencidoQtd: vencidos.length,
    custoAquisicaoAno,
  };
}

export interface PecaEstoqueBaixo {
  id: string;
  nome: string;
  codigo: string | null;
  qtd: number;
  estoqueMinimo: number;
}

/**
 * Peças ativas com saldo no mínimo configurado ou abaixo dele. SEM parâmetro
 * de empresa — estoque é compartilhado entre empresas (não tem empresa_id em
 * `pecas`, ver CLAUDE.md). Só entram peças com estoque_minimo > 0 (0 =
 * monitoramento desligado pra aquela peça).
 */
export async function buscarPecasEstoqueBaixo(): Promise<PecaEstoqueBaixo[]> {
  const { data, error } = await supabase
    .from('pecas')
    .select('id, nome, codigo, qtd, estoque_minimo')
    .eq('ativo', true)
    .gt('estoque_minimo', 0)
    .order('qtd', { ascending: true });
  if (error) throw error;

  return (data ?? [])
    .filter((p) => p.qtd <= p.estoque_minimo)
    .map((p) => ({ id: p.id, nome: p.nome, codigo: p.codigo, qtd: p.qtd, estoqueMinimo: p.estoque_minimo }));
}
