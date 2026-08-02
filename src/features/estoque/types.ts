/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — ESTOQUE
 * ============================================================================
 * Espelha as tabelas pecas/movimentacao_estoque (ver estoque.sql).
 * qtd e precoCusto são cache mantido pelo banco (trigger) — a aplicação nunca
 * edita esses dois campos diretamente, só lê.
 */

export interface Peca {
  id?: string;
  codigo: string;
  nome: string;
  descricao: string;
  unidade: string;
  categoria: string;
  precoVenda: string; // texto no formulário; vira number ao salvar
  /**
   * Abaixo desse valor (e maior que zero), a peça aparece no semáforo da
   * tela de Estoque e no alerta "Itens com estoque mínimo" do Dashboard.
   * '0' = monitoramento desligado pra essa peça. Texto no formulário, igual
   * precoVenda.
   */
  estoqueMinimo: string;
  ativo: boolean;
  observacoes: string;
  /** Cache mantido pelo banco — somente leitura na aplicação. */
  precoCusto: number;
  /** Cache mantido pelo banco (soma do razão) — somente leitura na aplicação. */
  qtd: number;
  /**
   * Estoque inicial — só usado na CRIAÇÃO da peça (nunca persistido em
   * `pecas`). Se preenchido, vira a primeira movimentação de ENTRADA
   * assim que a peça é salva (ver criarPecaComEstoqueInicial).
   */
  qtdInicial?: string;
  /** Custo unitário do estoque inicial — vira o custo daquela primeira entrada. */
  custoInicial?: string;
  /** Empresa (CNPJ) da nota do estoque inicial — vira o empresa_id daquela primeira entrada. */
  empresaIdInicial?: string;
  /** Fornecedor da nota do estoque inicial — vira o fornecedor_id daquela primeira entrada. Opcional, igual no Registrar entrada manual. */
  fornecedorIdInicial?: string;
}

export const pecaVazia = (): Peca => ({
  codigo: '',
  nome: '',
  descricao: '',
  unidade: 'un',
  categoria: '',
  precoVenda: '',
  estoqueMinimo: '0',
  ativo: true,
  observacoes: '',
  precoCusto: 0,
  qtd: 0,
  qtdInicial: '',
  custoInicial: '',
  empresaIdInicial: '',
  fornecedorIdInicial: '',
});

export type ErrosValidacao = Record<string, string>;

export function validarPeca(p: Peca): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!p.nome.trim()) erros.nome = 'Informe o nome.';
  if (p.precoVenda.trim() && Number.isNaN(Number(p.precoVenda)))
    erros.precoVenda = 'Preço de venda inválido.';
  if (p.estoqueMinimo.trim() && (Number.isNaN(Number(p.estoqueMinimo)) || Number(p.estoqueMinimo) < 0))
    erros.estoqueMinimo = 'Estoque mínimo inválido.';

  if (!p.id && p.qtdInicial?.trim()) {
    const qtdInicial = Number(p.qtdInicial);
    if (Number.isNaN(qtdInicial) || qtdInicial <= 0)
      erros.qtdInicial = 'Quantidade inicial deve ser maior que zero.';

    const custoInicial = Number(p.custoInicial);
    if (!p.custoInicial?.trim() || Number.isNaN(custoInicial) || custoInicial < 0)
      erros.custoInicial = 'Informe o custo unitário do estoque inicial.';

    if (!p.empresaIdInicial) erros.empresaIdInicial = 'Selecione a empresa (CNPJ) da nota.';
  }

  return erros;
}

export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

// ---- Movimentação de estoque -------------------------------------------------
// Razão append-only: a aplicação só cria movimentações, nunca edita/apaga.

export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste';

export interface Movimentacao {
  id?: string;
  pecaId: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  custoUnit: number | null;
  fornecedorId: string | null;
  /**
   * Empresa (CNPJ) da autopeças morais que recebeu a nota — só preenchido em
   * 'entrada' (é o destinatário da NF-e do fornecedor). Estoque continua
   * COMPARTILHADO entre as empresas (não filtra saldo/relatório); é só
   * controle de qual CNPJ comprou aquele lote. Ver CLAUDE.md.
   */
  empresaId: string | null;
  origem: string | null;
  observacoes: string;
  createdAt?: string;
}

/** Dados do formulário de ENTRADA (compra de fornecedor). */
export interface DadosEntrada {
  quantidade: string;
  custoUnit: string;
  fornecedorId: string;
  empresaId: string;
  observacoes: string;
}

export const dadosEntradaVazio = (): DadosEntrada => ({
  quantidade: '',
  custoUnit: '',
  fornecedorId: '',
  empresaId: '',
  observacoes: '',
});

export function validarEntrada(d: DadosEntrada): ErrosValidacao {
  const erros: ErrosValidacao = {};
  const qtd = Number(d.quantidade);
  if (!d.quantidade.trim() || Number.isNaN(qtd) || qtd <= 0)
    erros.quantidade = 'Informe uma quantidade maior que zero.';
  const custo = Number(d.custoUnit);
  if (!d.custoUnit.trim() || Number.isNaN(custo) || custo < 0)
    erros.custoUnit = 'Informe o custo unitário.';
  if (!d.empresaId) erros.empresaId = 'Selecione a empresa (CNPJ) da nota.';
  return erros;
}

/** Dados do formulário de AJUSTE (correção manual, exige motivo). */
export interface DadosAjuste {
  quantidade: string; // sempre digitada positiva; o sentido define o sinal
  sentido: 'aumentar' | 'diminuir';
  observacoes: string; // motivo — obrigatório, fica na auditoria
}

export const dadosAjusteVazio = (): DadosAjuste => ({
  quantidade: '',
  sentido: 'aumentar',
  observacoes: '',
});

export function validarAjuste(d: DadosAjuste): ErrosValidacao {
  const erros: ErrosValidacao = {};
  const qtd = Number(d.quantidade);
  if (!d.quantidade.trim() || Number.isNaN(qtd) || qtd <= 0)
    erros.quantidade = 'Informe uma quantidade maior que zero.';
  if (!d.observacoes.trim()) erros.observacoes = 'Informe o motivo do ajuste.';
  return erros;
}

/**
 * Devolução ao fornecedor: peça que já tinha dado ENTRADA sai de novo do
 * estoque, sempre por um destes dois motivos — defeito na peça, ou a nota
 * fiscal da compra foi cancelada. Cada motivo vira uma `origem` diferente
 * na movimentação (ver registrarDevolucaoFornecedor), pra dar pra filtrar/
 * relatar cada situação separadamente depois — não é um "ajuste" genérico
 * de texto livre.
 */
export type MotivoDevolucaoFornecedor = 'defeito' | 'nfe_cancelada';

export const ROTULO_MOTIVO_DEVOLUCAO_FORNECEDOR: Record<MotivoDevolucaoFornecedor, string> = {
  defeito: 'Defeito na peça',
  nfe_cancelada: 'Nota fiscal cancelada',
};

/** Dados do formulário de DEVOLUÇÃO AO FORNECEDOR. */
export interface DadosDevolucaoFornecedor {
  quantidade: string;
  motivo: MotivoDevolucaoFornecedor | '';
  fornecedorId: string;
  observacoes: string;
}

export const dadosDevolucaoFornecedorVazio = (): DadosDevolucaoFornecedor => ({
  quantidade: '',
  motivo: '',
  fornecedorId: '',
  observacoes: '',
});

export function validarDevolucaoFornecedor(d: DadosDevolucaoFornecedor): ErrosValidacao {
  const erros: ErrosValidacao = {};
  const qtd = Number(d.quantidade);
  if (!d.quantidade.trim() || Number.isNaN(qtd) || qtd <= 0)
    erros.quantidade = 'Informe uma quantidade maior que zero.';
  if (!d.motivo) erros.motivo = 'Selecione o motivo da devolução.';
  return erros;
}
