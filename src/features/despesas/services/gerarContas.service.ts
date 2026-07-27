/**
 * ============================================================================
 * GERAR CONTAS DO MÊS (a partir das despesas fixas)
 * ============================================================================
 * Cria uma linha em financeiro (tipo='pagar') pra cada despesa fixa ativa,
 * com vencimento no dia_vencimento do mês de referência (hoje, por padrão).
 * Rodar de novo no mesmo mês não duplica — o índice único
 * (despesa_fixa_id, vencimento) barra a segunda tentativa, que é tratada
 * como "já existia" (não é erro).
 */

import { criarLancamento } from '@/features/financeiro';
import { listarDespesasFixas } from './despesas.service';

export interface ResultadoGeracao {
  criadas: number;
  jaExistiam: number;
}

function ehViolacaoDeUnicidade(erro: unknown): boolean {
  return typeof erro === 'object' && erro !== null && (erro as { code?: string }).code === '23505';
}

function calcularVencimento(referencia: Date, diaVencimento: number): string {
  const data = new Date(referencia.getFullYear(), referencia.getMonth(), diaVencimento);
  return data.toISOString().slice(0, 10);
}

/** Gera as contas do mês só pra despesas de uma empresa (CNPJ) específica. */
export async function gerarContasDoMes(empresaId: string, referencia: Date = new Date()): Promise<ResultadoGeracao> {
  const despesas = await listarDespesasFixas({ somenteAtivas: true, empresaId });
  let criadas = 0;
  let jaExistiam = 0;

  for (const despesa of despesas) {
    const vencimento = calcularVencimento(referencia, Number(despesa.diaVencimento));
    try {
      await criarLancamento({
        empresaId: despesa.empresaId,
        tipo: 'pagar',
        categoria: despesa.categoria,
        descricao: despesa.descricao,
        valor: Number(despesa.valor),
        pago: false,
        formaPagamento: null,
        dataPagamento: null,
        vencimento,
        clienteId: null,
        fornecedorId: despesa.fornecedorId || null,
        osId: null,
        vendaId: null,
        despesaFixaId: despesa.id ?? null,
        observacoes: `Gerado automaticamente a partir da despesa fixa "${despesa.descricao}".`,
      });
      criadas++;
    } catch (erro) {
      if (!ehViolacaoDeUnicidade(erro)) throw erro;
      jaExistiam++;
    }
  }

  return { criadas, jaExistiam };
}
