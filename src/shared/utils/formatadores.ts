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
