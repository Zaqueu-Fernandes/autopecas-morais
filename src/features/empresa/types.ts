/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — EMPRESAS
 * ============================================================================
 * Espelha empresa_config — NÃO é mais singleton, pode ter várias linhas.
 * Cada empresa é um CNPJ/MEI separado; o financeiro (lançamentos, despesas
 * fixas) é dividido por empresa, mas clientes/estoque/OS continuam
 * compartilhados (mesma oficina física, só o faturamento é separado — ver
 * CLAUDE.md). `regime` é o interruptor MEI ↔ ME por empresa.
 */

export type RegimeTributario = 'MEI' | 'ME_SIMPLES';

export const ROTULO_REGIME: Record<RegimeTributario, string> = {
  MEI: 'MEI',
  ME_SIMPLES: 'ME (Simples Nacional)',
};

export interface Empresa {
  id?: string;
  nomeFantasia: string;
  cnpj: string;
  regime: RegimeTributario;
  limiteAnualMei: string; // texto no formulário; vira number ao salvar
}

export const empresaVazia = (): Empresa => ({
  nomeFantasia: '',
  cnpj: '',
  regime: 'MEI',
  limiteAnualMei: '81000',
});

export type ErrosValidacao = Record<string, string>;
export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

export function validarEmpresa(e: Empresa): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!e.nomeFantasia.trim()) erros.nomeFantasia = 'Informe o nome da empresa.';
  if (!e.cnpj.trim()) erros.cnpj = 'Informe o CNPJ.';
  if (e.regime === 'MEI') {
    const limite = Number(e.limiteAnualMei);
    if (!e.limiteAnualMei.trim() || Number.isNaN(limite) || limite <= 0)
      erros.limiteAnualMei = 'Informe um limite anual válido.';
  }
  return erros;
}
