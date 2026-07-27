/**
 * ============================================================================
 * FLUXO DE CAIXA
 * ============================================================================
 * Só considera lançamentos JÁ QUITADOS (pago=true) — fluxo de caixa é
 * dinheiro que realmente entrou/saiu, por data_pagamento. Diferente do
 * "faturamento" do Dashboard, que conta pela data da venda/OS (created_at),
 * independente de já ter sido recebido.
 *
 * "Saldo anterior" soma tudo que foi quitado antes do período — não é um
 * saldo bancário de verdade (o app não tem conta/banco cadastrado), é só o
 * acumulado de tudo que passou pelo financeiro até ali.
 */

import { supabase } from '@/lib/supabase';
import type { TipoFinanceiro } from '../types';

export interface MovimentoCaixa {
  id: string;
  tipo: TipoFinanceiro;
  categoria: string;
  descricao: string;
  valor: number;
  dataPagamento: string;
  saldoAcumulado: number;
}

export interface ResultadoFluxoCaixa {
  saldoAnterior: number;
  movimentos: MovimentoCaixa[];
  totalEntradas: number;
  totalSaidas: number;
  saldoFinal: number;
}

interface LinhaMovimento {
  id: string;
  tipo: TipoFinanceiro;
  categoria: string;
  descricao: string;
  valor: number;
  data_pagamento: string;
}

/** `inicio`/`fim` no formato yyyy-mm-dd (inclusive dos dois lados). */
export async function buscarFluxoCaixa(inicio: string, fim: string): Promise<ResultadoFluxoCaixa> {
  const inicioISO = new Date(`${inicio}T00:00:00`).toISOString();
  const fimISO = new Date(`${fim}T23:59:59.999`).toISOString();

  const { data: anteriores, error: erroAnteriores } = await supabase
    .from('financeiro')
    .select('tipo, valor')
    .eq('pago', true)
    .lt('data_pagamento', inicioISO);
  if (erroAnteriores) throw erroAnteriores;

  const saldoAnterior = (anteriores ?? []).reduce(
    (soma, r) => soma + (r.tipo === 'receber' ? Number(r.valor) : -Number(r.valor)),
    0,
  );

  const { data, error } = await supabase
    .from('financeiro')
    .select('id, tipo, categoria, descricao, valor, data_pagamento')
    .eq('pago', true)
    .gte('data_pagamento', inicioISO)
    .lte('data_pagamento', fimISO)
    .order('data_pagamento', { ascending: true });
  if (error) throw error;

  let saldo = saldoAnterior;
  let totalEntradas = 0;
  let totalSaidas = 0;

  const movimentos: MovimentoCaixa[] = (data as LinhaMovimento[]).map((r) => {
    const valor = Number(r.valor);
    if (r.tipo === 'receber') {
      saldo += valor;
      totalEntradas += valor;
    } else {
      saldo -= valor;
      totalSaidas += valor;
    }
    return {
      id: r.id,
      tipo: r.tipo,
      categoria: r.categoria,
      descricao: r.descricao,
      valor,
      dataPagamento: r.data_pagamento,
      saldoAcumulado: saldo,
    };
  });

  return { saldoAnterior, movimentos, totalEntradas, totalSaidas, saldoFinal: saldo };
}
