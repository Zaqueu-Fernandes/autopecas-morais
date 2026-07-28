/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — DESPESAS FIXAS
 * ============================================================================
 * Espelha despesas_fixas (ver despesas_fixas.sql). A lista de categorias é
 * duplicada da CategoriaPagar do financeiro de propósito — evita a feature
 * financeiro precisar importar código desta feature (só o inverso: despesas
 * chama criarLancamento do financeiro pra gerar as contas do mês).
 */

/**
 * 'despesa_geral' substitui as antigas 'despesa_fixa'/'despesa_variavel':
 * com tipoValor (fixo/variável) e periodicidade já cobrindo essas duas
 * dimensões, ter uma categoria chamada "fixa" só duplicava (e às vezes
 * contradizia — categoria fixa com tipoValor variável) esses campos.
 * fornecedor/imposto/folha/retirada_lucro continuam: são classificação
 * contábil de verdade, não duplicam nada.
 */
export type CategoriaDespesaFixa = 'fornecedor' | 'despesa_geral' | 'imposto' | 'folha' | 'retirada_lucro';

export const ROTULO_CATEGORIA_DESPESA: Record<CategoriaDespesaFixa, string> = {
  fornecedor: 'Fornecedor',
  despesa_geral: 'Despesa geral',
  imposto: 'Imposto',
  folha: 'Folha de pagamento',
  retirada_lucro: 'Retirada de lucro',
};

/**
 * 'fixo': valor sempre igual (aluguel, mensalidade) — o campo `valor` É o
 * valor real. 'variavel': muda todo mês (água, luz) mas tem dia de
 * vencimento fixo — `valor` é só uma MÉDIA/estimativa; o valor real de cada
 * mês é ajustado depois em Financeiro, na conta já gerada (ver
 * atualizarValorLancamento), antes de quitar.
 */
export type TipoValorDespesa = 'fixo' | 'variavel';

export const ROTULO_TIPO_VALOR: Record<TipoValorDespesa, string> = {
  fixo: 'Fixo',
  variavel: 'Variável',
};

/**
 * Com que frequência a despesa se repete. Muda o que `diaVencimento`
 * significa e se `mesVencimento` é usado:
 *   mensal  -> diaVencimento = dia do mês (1-28)
 *   anual   -> diaVencimento = dia do mês (1-28) + mesVencimento (1-12)
 *   semanal -> diaVencimento = dia da semana (0=domingo … 6=sábado)
 * "Gerar contas do mês" usa isso pra calcular quais vencimentos caem
 * dentro do mês de referência (ver calcularVencimentosDoMes).
 */
export type Periodicidade = 'semanal' | 'mensal' | 'anual';

export const ROTULO_PERIODICIDADE: Record<Periodicidade, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  anual: 'Anual',
};

export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const MESES_ANO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export interface DespesaFixa {
  id?: string;
  /** A qual empresa (CNPJ) esta despesa pertence — as contas geradas herdam essa empresa. */
  empresaId: string;
  descricao: string;
  categoria: CategoriaDespesaFixa;
  tipoValor: TipoValorDespesa;
  valor: string; // texto no formulário; vira number ao salvar — real se fixo, média se variável
  periodicidade: Periodicidade;
  diaVencimento: string; // significado depende de periodicidade — ver Periodicidade acima
  mesVencimento: string; // só usado quando periodicidade='anual' (1-12)
  fornecedorId: string;
  ativo: boolean;
  observacoes: string;
}

export const despesaFixaVazia = (): DespesaFixa => ({
  empresaId: '',
  descricao: '',
  categoria: 'despesa_geral',
  tipoValor: 'fixo',
  valor: '',
  periodicidade: 'mensal',
  diaVencimento: '',
  mesVencimento: '',
  fornecedorId: '',
  ativo: true,
  observacoes: '',
});

export type ErrosValidacao = Record<string, string>;
export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

export function validarDespesaFixa(d: DespesaFixa): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.empresaId) erros.empresaId = 'Selecione a empresa.';
  if (!d.descricao.trim()) erros.descricao = 'Descreva a despesa.';
  const valor = Number(d.valor);
  if (!d.valor.trim() || Number.isNaN(valor) || valor <= 0)
    erros.valor = 'Informe um valor maior que zero.';

  const dia = Number(d.diaVencimento);
  if (d.periodicidade === 'semanal') {
    if (!d.diaVencimento.trim() || Number.isNaN(dia) || dia < 0 || dia > 6)
      erros.diaVencimento = 'Selecione o dia da semana.';
  } else {
    if (!d.diaVencimento.trim() || Number.isNaN(dia) || dia < 1 || dia > 28)
      erros.diaVencimento = 'Informe um dia entre 1 e 28.';
    if (d.periodicidade === 'anual') {
      const mes = Number(d.mesVencimento);
      if (!d.mesVencimento.trim() || Number.isNaN(mes) || mes < 1 || mes > 12)
        erros.mesVencimento = 'Selecione o mês.';
    }
  }

  if (d.categoria === 'fornecedor' && !d.fornecedorId)
    erros.fornecedorId = 'Selecione o fornecedor.';
  return erros;
}
