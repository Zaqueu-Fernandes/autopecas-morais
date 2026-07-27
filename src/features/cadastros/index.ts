/**
 * ============================================================================
 * CADASTROS — PONTO DE ENTRADA
 * ============================================================================
 * import { FormCliente, FormFornecedor, buscarCEP } from '@/cadastros';
 * import '@/cadastros/cadastros.css';
 */

export { FormCliente } from './components/FormCliente';
export { FormFornecedor } from './components/FormFornecedor';
export { CamposEndereco } from './components/CamposEndereco';
export { buscarCEP, formatarCEP, limparCEP } from './services/cep';
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
