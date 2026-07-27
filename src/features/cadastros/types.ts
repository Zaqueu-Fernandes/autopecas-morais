/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — CADASTROS
 * ============================================================================
 * Espelha as tabelas clientes/fornecedores e centraliza as regras de
 * obrigatoriedade (que ficam na aplicação, não no banco — ver cadastros.sql).
 */

export type TipoPessoa = 'PF' | 'PJ';

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface Cliente extends Endereco {
  id?: string;
  nome: string;
  tipoPessoa: TipoPessoa;
  documento: string; // CPF ou CNPJ
  telefone: string;
  email: string;
  observacoes: string;
}

export interface Fornecedor extends Endereco {
  id?: string;
  nome: string;
  cnpj: string;
  telefone: string;
  email: string;
  observacoes: string;
}

/** Registro em branco pra iniciar o formulário de cliente. */
export const clienteVazio = (): Cliente => ({
  nome: '',
  tipoPessoa: 'PF',
  documento: '',
  telefone: '',
  email: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  observacoes: '',
});

export const fornecedorVazio = (): Fornecedor => ({
  nome: '',
  cnpj: '',
  telefone: '',
  email: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  observacoes: '',
});

// ---- Validação -------------------------------------------------------------

export type ErrosValidacao = Record<string, string>;

/**
 * Regras (conforme decidido):
 *   • Sempre: nome, telefone
 *   • Endereço completo obrigatório quando PJ OU quando exigirNota=true (Fase 3)
 *   • PF no balcão (MEI): endereço opcional
 */
export function validarCliente(
  c: Cliente,
  opts: { exigirNota?: boolean } = {},
): ErrosValidacao {
  const erros: ErrosValidacao = {};

  if (!c.nome.trim()) erros.nome = 'Informe o nome.';
  if (!c.telefone.trim()) erros.telefone = 'Informe o telefone.';

  const enderecoObrigatorio = c.tipoPessoa === 'PJ' || !!opts.exigirNota;
  if (enderecoObrigatorio) {
    if (!c.cep.trim()) erros.cep = 'CEP obrigatório para PJ / emissão de nota.';
    if (!c.logradouro.trim()) erros.logradouro = 'Informe o logradouro.';
    if (!c.numero.trim()) erros.numero = 'Informe o número.';
    if (!c.bairro.trim()) erros.bairro = 'Informe o bairro.';
    if (!c.cidade.trim()) erros.cidade = 'Informe a cidade.';
    if (!c.uf.trim()) erros.uf = 'Informe a UF.';
    if (!c.documento.trim())
      erros.documento = 'Documento obrigatório para PJ / emissão de nota.';
  }

  return erros;
}

export function validarFornecedor(f: Fornecedor): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!f.nome.trim()) erros.nome = 'Informe o nome.';
  if (!f.telefone.trim() && !f.cnpj.trim())
    erros.telefone = 'Informe ao menos telefone ou CNPJ.';
  return erros;
}

export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

// ---- Veículos ---------------------------------------------------------------
// Cadastrados sempre vinculados a um cliente (dono do veículo).

export interface Veiculo {
  id?: string;
  clienteId: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: string; // texto no formulário; vira number ao salvar (ver veiculos.service.ts)
  cor: string;
  quilometragem: string; // idem
  observacoes: string;
}

export const veiculoVazio = (clienteId: string): Veiculo => ({
  clienteId,
  placa: '',
  marca: '',
  modelo: '',
  ano: '',
  cor: '',
  quilometragem: '',
  observacoes: '',
});

export function validarVeiculo(v: Veiculo): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!v.placa.trim()) erros.placa = 'Informe a placa.';
  if (v.ano.trim() && !/^\d{4}$/.test(v.ano.trim()))
    erros.ano = 'Ano deve ter 4 dígitos.';
  return erros;
}
