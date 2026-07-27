/**
 * ============================================================================
 * CADASTROS — PONTO DE ENTRADA
 * ============================================================================
 * import { FormCliente, FormFornecedor, buscarCEP } from '@/features/cadastros';
 * import '@/features/cadastros/cadastros.css';
 */

export { FormCliente } from './components/FormCliente';
export { FormFornecedor } from './components/FormFornecedor';
export { FormVeiculo } from './components/FormVeiculo';
export { CamposEndereco } from './components/CamposEndereco';
export { VeiculosDoCliente } from './components/VeiculosDoCliente';

export { buscarCEP, formatarCEP, limparCEP } from './services/cep';
export type { ResultadoCEP, EnderecoViaCEP } from './services/cep';

export * from './services/clientes.service';
export * from './services/fornecedores.service';
export * from './services/veiculos.service';

export {
  clienteVazio,
  fornecedorVazio,
  veiculoVazio,
  validarCliente,
  validarFornecedor,
  validarVeiculo,
  semErros,
  type Cliente,
  type Fornecedor,
  type Veiculo,
  type Endereco,
  type TipoPessoa,
  type ErrosValidacao,
} from './types';
