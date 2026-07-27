/**
 * ============================================================================
 * MONITOR MEI DE UMA EMPRESA — busca o faturamento do ano dela e desenha
 * ============================================================================
 * Usado no Dashboard pra mostrar todas as empresas cadastradas lado a lado,
 * cada uma com seu próprio progresso em relação ao limite do MEI.
 */

import { useEffect, useState } from 'react';
import type { Empresa } from '@/features/empresa';
import { MonitorMei } from './MonitorMei';
import { buscarResumoDashboard } from '../services/dashboard.service';

interface Props {
  empresa: Empresa;
}

export function MonitorMeiEmpresa({ empresa }: Props) {
  const [faturamentoAno, setFaturamentoAno] = useState<number | null>(null);

  useEffect(() => {
    buscarResumoDashboard(empresa.id).then((r) => setFaturamentoAno(r.faturamentoAno));
  }, [empresa.id]);

  return (
    <div className="dash-monitor-empresa">
      <h3>{empresa.nomeFantasia}</h3>
      {faturamentoAno === null ? (
        <p>Carregando…</p>
      ) : (
        <MonitorMei
          regime={empresa.regime}
          faturamentoAno={faturamentoAno}
          limiteAnualMei={Number(empresa.limiteAnualMei)}
        />
      )}
    </div>
  );
}
