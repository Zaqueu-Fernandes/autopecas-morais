/**
 * ============================================================================
 * CARTÃO DE RESUMO (KPI) — peça reutilizável do Dashboard
 * ============================================================================
 */

interface Props {
  titulo: string;
  valor: string;
  tom?: 'neutro' | 'aviso' | 'perigo';
}

export function CartaoResumo({ titulo, valor, tom = 'neutro' }: Props) {
  return (
    <div className={`dash-cartao dash-cartao-${tom}`}>
      <span className="dash-cartao-titulo">{titulo}</span>
      <strong className="dash-cartao-valor">{valor}</strong>
    </div>
  );
}
