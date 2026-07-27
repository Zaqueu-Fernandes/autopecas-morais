/**
 * ============================================================================
 * TIPOS E VALIDAÇÃO — CONFIGURAÇÃO DA EMPRESA
 * ============================================================================
 * Espelha empresa_config (ver empresa.sql). Singleton: só existe uma linha.
 * `regime` é o interruptor MEI ↔ ME (ver arquitetura de negócio no CLAUDE.md).
 */

export type RegimeTributario = 'MEI' | 'ME_SIMPLES';

export const ROTULO_REGIME: Record<RegimeTributario, string> = {
  MEI: 'MEI',
  ME_SIMPLES: 'ME (Simples Nacional)',
};

export interface ConfigEmpresa {
  id?: string;
  regime: RegimeTributario;
  limiteAnualMei: string; // texto no formulário; vira number ao salvar
  nomeFantasia: string;
}

export const configEmpresaVazia = (): ConfigEmpresa => ({
  regime: 'MEI',
  limiteAnualMei: '81000',
  nomeFantasia: '',
});

export type ErrosValidacao = Record<string, string>;
export const semErros = (e: ErrosValidacao) => Object.keys(e).length === 0;

export function validarConfigEmpresa(c: ConfigEmpresa): ErrosValidacao {
  const erros: ErrosValidacao = {};
  if (!c.nomeFantasia.trim()) erros.nomeFantasia = 'Informe o nome da oficina.';
  const limite = Number(c.limiteAnualMei);
  if (!c.limiteAnualMei.trim() || Number.isNaN(limite) || limite <= 0)
    erros.limiteAnualMei = 'Informe um limite anual válido.';
  return erros;
}
