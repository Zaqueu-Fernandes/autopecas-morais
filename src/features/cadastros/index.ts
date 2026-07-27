/**
 * ============================================================================
 * CADASTROS — PONTO DE ENTRADA
 * ============================================================================
 * import { FormCliente, FormFornecedor, buscarCEP } from '@/cadastros';
 * import '@/cadastros/cadastros.css';
 */

export { FormCliente } from './FormCliente';
export { FormFornecedor } from './FormFornecedor';
export { CamposEndereco } from './CamposEndereco';
export { buscarCEP, formatarCEP, limparCEP } from './cep';
export type { ResultadoCEP, EnderecoViaCEP } from './cep';
export {
  clienteVazio,
  fornecedorVazio,
  validarCliente,
  validarFornecedor,
  semErros,
  type Cliente,
  type Fornecedor,
  type Endereco,
  type TipoPessoa,
  type ErrosValidacao,
} from './types';
