/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — ORDENS DE SERVIÇO
 * ============================================================================
 * Espelha ordens_servico/os_itens (ver ordens_servico.sql).
 * Fluxo de status: aberta → em_andamento → concluida → faturada. Faturamento
 * é feature separada; aqui só avançamos até 'concluida'.
 */

export type StatusOS = 'aberta' | 'em_andamento' | 'concluida' | 'faturada';

export const ROTULO_STATUS_OS: Record<StatusOS, string> = {
  aberta: 'Aberta',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  faturada: 'Faturada',
};

export interface OrdemServico {
  id?: string;
  numero?: number;
  clienteId: string;
  veiculoId: string;
  status: StatusOS;
  descricaoProblema: string;
  observacoes: string;
  dataAbertura?: string;
  dataConclusao?: string | null;
}

/** Versão usada na listagem: já traz nome do cliente e dados do veículo (join). */
export interface OrdemServicoResumo extends OrdemServico {
  clienteNome: string;
  veiculoPlaca: string;
  veiculoMarcaModelo: string;
}

export const ordemServicoVazia = (): OrdemServico => ({
  clienteId: '',
  veiculoId: '',
  status: 'aberta',
  descricaoProblema: '',
  observacoes: '',
});

export type ErrosValidacao = Record<string, string>;

export function validarOS(os: OrdemServico): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!os.clienteId) erros.clienteId = 'Selecione o cliente.';
  if (!os.veiculoId) erros.veiculoId = 'Selecione o veículo.';
  if (!os.descricaoProblema.trim()) erros.descricaoProblema = 'Descreva o problema relatado.';
  return erros;
}

export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

/** Próximo status linear — null quando não há avanço possível nesta tela. */
export const PROXIMO_STATUS: Record<StatusOS, StatusOS | null> = {
  aberta: 'em_andamento',
  em_andamento: 'concluida',
  concluida: null, // faturamento fica pra feature separada
  faturada: null,
};

// ---- Itens da OS --------------------------------------------------------

export type TipoItemOS = 'peca' | 'servico';

export interface ItemOS {
  id?: string;
  osId: string;
  tipo: TipoItemOS;
  pecaId: string | null;
  movimentacaoId: string | null;
  descricao: string;
  quantidade: number;
  valorUnit: number;
  removido: boolean;
  motivoRemocao: string | null;
  createdAt?: string;
}

export interface DadosItemPeca {
  pecaId: string;
  quantidade: string;
}

export const dadosItemPecaVazio = (): DadosItemPeca => ({ pecaId: '', quantidade: '1' });

export function validarItemPeca(d: DadosItemPeca): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.pecaId) erros.pecaId = 'Selecione a peça.';
  const qtd = Number(d.quantidade);
  if (!d.quantidade.trim() || Number.isNaN(qtd) || qtd <= 0)
    erros.quantidade = 'Informe uma quantidade maior que zero.';
  return erros;
}

export interface DadosItemServico {
  descricao: string;
  quantidade: string;
  valorUnit: string;
}

export const dadosItemServicoVazio = (): DadosItemServico => ({
  descricao: '',
  quantidade: '1',
  valorUnit: '',
});

export function validarItemServico(d: DadosItemServico): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!d.descricao.trim()) erros.descricao = 'Descreva o serviço.';
  const qtd = Number(d.quantidade);
  if (!d.quantidade.trim() || Number.isNaN(qtd) || qtd <= 0)
    erros.quantidade = 'Informe uma quantidade maior que zero.';
  const valor = Number(d.valorUnit);
  if (!d.valorUnit.trim() || Number.isNaN(valor) || valor < 0)
    erros.valorUnit = 'Informe o valor do serviço.';
  return erros;
}
