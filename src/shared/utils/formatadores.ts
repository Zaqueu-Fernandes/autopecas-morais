/**
 * ============================================================================
 * HELPERS — FORMATAÇÃO DE MOEDA E NÚMERO (padrão pt-BR)
 * ============================================================================
 * Centraliza o uso de Intl.* pra formatação de valores em tela. Nunca formatar
 * moeda/número "na mão" (ex.: `R$ ${valor.toFixed(2)}`) — isso quebra o
 * separador de milhar (1000 vira "1000.00" em vez de "1.000,00") e não usa o
 * espaço não separável que o Intl já coloca entre "R$" e o valor.
 */

/** Ex.: formatarMoeda(1234.5) -> "R$ 1.234,50" */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

/** Ex.: formatarNumero(1234.5, 1) -> "1.234,5" | formatarNumero(45) -> "45" */
export function formatarNumero(valor: number, casasDecimais = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(valor);
}

/** Ex.: formatarPercentual(45.2) -> "45%" (arredonda, sem casas decimais) */
export function formatarPercentual(valor: number): string {
  return `${formatarNumero(valor, 0)}%`;
}

/**
 * Inverso de formatarMoeda/formatarNumero: converte texto DIGITADO (formato
 * pt-BR, vírgula decimal, com ou sem ponto de milhar) pra number de verdade.
 * `Number("52,50")` sozinho retorna NaN — JS não entende vírgula como
 * decimal — e isso silenciosamente vira `null` num insert do Supabase,
 * derrubando o salvamento sem aviso claro. Sempre usar isso (nunca `Number`
 * puro) ao converter um campo de texto que aceita formato "0,00".
 * Ex.: paraNumero("52,50") -> 52.5 | paraNumero("6.250,00") -> 6250
 *      paraNumero("6250.5") -> 6250.5 (já em formato JS, sem vírgula — mantém)
 */
export function paraNumero(texto: string): number {
  const limpo = texto.trim();
  if (!limpo) return NaN;
  if (limpo.includes(',')) {
    return Number(limpo.replace(/\./g, '').replace(',', '.'));
  }
  return Number(limpo);
}
