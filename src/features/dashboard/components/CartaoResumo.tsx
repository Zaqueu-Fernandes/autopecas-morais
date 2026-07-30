/**
 * ============================================================================
 * CARTÃO DE RESUMO (KPI) — peça reutilizável do Dashboard/Fluxo de Caixa
 * ============================================================================
 */

import type { ReactNode } from 'react';

interface Props {
  titulo: string;
  valor: string;
  tom?: 'neutro' | 'aviso' | 'perigo' | 'sucesso';
  icone?: ReactNode;
}

export function CartaoResumo({ titulo, valor, tom = 'neutro', icone }: Props) {
  return (
    <div className={`dash-cartao dash-cartao-${tom}`}>
      <div className="dash-cartao-cabecalho">
        <span className="dash-cartao-titulo">{titulo}</span>
        {icone && <span className="dash-cartao-icone">{icone}</span>}
      </div>
      <strong className="dash-cartao-valor">{valor}</strong>
    </div>
  );
}
