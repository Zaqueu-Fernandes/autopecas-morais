/**
 * ============================================================================
 * GERAR CONTAS DO MÊS (a partir das despesas recorrentes)
 * ============================================================================
 * Cria uma linha em financeiro (tipo='pagar') pra cada vencimento que cai
 * dentro do mês de referência (hoje, por padrão), conforme a periodicidade
 * de cada despesa ativa (ver calcularVencimentosDoMes): mensal gera um
 * vencimento; anual gera um só no mês certo (nenhum nos outros); semanal
 * pode gerar vários no mesmo mês, um por dia da semana escolhido.
 * Rodar de novo no mesmo mês não duplica — o índice único
 * (despesa_fixa_id, vencimento) barra a segunda tentativa de cada data já
 * gerada, tratada como "já existia" (não é erro).
 */

import { criarLancamento } from '@/features/financeiro';
import { listarDespesasFixas } from './despesas.service';
import type { DespesaFixa } from '../types';

export interface ResultadoGeracao {
  criadas: number;
  jaExistiam: number;
}

function ehViolacaoDeUnicidade(erro: unknown): boolean {
  return typeof erro === 'object' && erro !== null && (erro as { code?: string }).code === '23505';
}

function paraISO(ano: number, mesIndice0: number, dia: number): string {
  return new Date(ano, mesIndice0, dia).toISOString().slice(0, 10);
}

/** Quais vencimentos desta despesa caem dentro do mês de `referencia`. */
export function calcularVencimentosDoMes(despesa: DespesaFixa, referencia: Date): string[] {
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth(); // 0-indexado
  const dia = Number(despesa.diaVencimento);

  if (despesa.periodicidade === 'mensal') {
    return [paraISO(ano, mes, dia)];
  }

  if (despesa.periodicidade === 'anual') {
    if (Number(despesa.mesVencimento) !== mes + 1) return []; // não é o mês desta despesa
    return [paraISO(ano, mes, dia)];
  }

  // semanal: um vencimento pra cada dia do mês que cai no dia da semana escolhido
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const vencimentos: string[] = [];
  for (let d = 1; d <= diasNoMes; d++) {
    if (new Date(ano, mes, d).getDay() === dia) vencimentos.push(paraISO(ano, mes, d));
  }
  return vencimentos;
}

/**
 * Gera as contas do mês pra TODAS as despesas ativas (não tem mais recorte
 * por empresa — despesa recorrente é global, ver types.ts). Cada conta nasce
 * com empresaId null ("Empresa a Definir" na UI) — a empresa que realmente
 * pagou só é definida no momento de Quitar (ver FormQuitacao).
 */
export async function gerarContasDoMes(referencia: Date = new Date()): Promise<ResultadoGeracao> {
  const despesas = await listarDespesasFixas({ somenteAtivas: true });
  let criadas = 0;
  let jaExistiam = 0;

  for (const despesa of despesas) {
    for (const vencimento of calcularVencimentosDoMes(despesa, referencia)) {
      try {
        await criarLancamento({
          empresaId: null,
          tipo: 'pagar',
          categoria: despesa.categoria,
          descricao: despesa.descricao,
          valor: Number(despesa.valor),
          pago: false,
          formaPagamento: null,
          contaFinanceiraId: null,
          dataPagamento: null,
          vencimento,
          clienteId: null,
          fornecedorId: despesa.fornecedorId || null,
          osId: null,
          vendaId: null,
          despesaFixaId: despesa.id ?? null,
          periodicidade: despesa.periodicidade,
          observacoes: `Gerado automaticamente a partir da despesa recorrente "${despesa.descricao}".`,
        });
        criadas++;
      } catch (erro) {
        if (!ehViolacaoDeUnicidade(erro)) throw erro;
        jaExistiam++;
      }
    }
  }

  return { criadas, jaExistiam };
}
