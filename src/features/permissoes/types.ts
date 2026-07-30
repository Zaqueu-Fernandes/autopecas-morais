/**
 * ============================================================================
 * TIPOS — PERMISSÕES GRANULARES POR USUÁRIO
 * ============================================================================
 * Espelha a tabela permissoes_usuario (ver permissoes_usuario.sql). Admin
 * SEMPRE tem as 6 (tem_permissao() no banco embute is_admin()) — isso aqui
 * só existe pra configurar OPERADORES individualmente.
 */

export type ChavePermissao =
  | 'devolver_os_item'
  | 'devolver_venda_item'
  | 'estornar_financeiro'
  | 'desativar_despesa_recorrente'
  | 'ajustar_estoque'
  | 'devolver_fornecedor';

export const CHAVES_PERMISSAO: ChavePermissao[] = [
  'devolver_os_item',
  'devolver_venda_item',
  'estornar_financeiro',
  'desativar_despesa_recorrente',
  'ajustar_estoque',
  'devolver_fornecedor',
];

export const ROTULO_PERMISSAO: Record<ChavePermissao, string> = {
  devolver_os_item: 'Devolver item (Ordens de Serviço)',
  devolver_venda_item: 'Devolver item (Vendas de Balcão)',
  estornar_financeiro: 'Estornar lançamento (Financeiro)',
  desativar_despesa_recorrente: 'Desativar despesa recorrente',
  ajustar_estoque: 'Ajustar estoque manualmente',
  devolver_fornecedor: 'Devolver ao fornecedor',
};

export interface Operador {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface OperadorComPermissoes extends Operador {
  permissoes: Record<ChavePermissao, boolean>;
}
