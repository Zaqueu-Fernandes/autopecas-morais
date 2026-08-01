/**
 * ============================================================================
 * MONITORES MEI DE UMA EMPRESA — busca o resumo do ano dela e desenha
 * ============================================================================
 * Usado no Dashboard pra mostrar todas as empresas cadastradas lado a lado,
 * cada uma com seu próprio progresso em relação ao limite do MEI: primeiro
 * o faturamento (o que de fato conta pro limite), depois o custo de
 * aquisição de peças (alerta antecipado — venda = custo + margem, então o
 * custo sozinho já indica se o faturamento vai estourar o limite).
 */

import { useEffect, useState } from 'react';
import type { Empresa } from '@/features/empresa';
import { useAuth } from '@/features/auth';
import { MonitorMei } from './MonitorMei';
import { MonitorCustoAquisicao } from './MonitorCustoAquisicao';
import { buscarResumoDashboard, type ResumoDashboard } from '../services/dashboard.service';

interface Props {
  empresa: Empresa;
}

export function MonitorMeiEmpresa({ empresa }: Props) {
  const { sessao } = useAuth();
  const meuId = sessao?.user.id;
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);

  useEffect(() => {
    buscarResumoDashboard(empresa.id, meuId).then(setResumo);
  }, [empresa.id, meuId]);

  return (
    <div className="dash-monitor-empresa">
      <h3>{empresa.nomeFantasia}</h3>
      <div aria-live="polite">
        {resumo === null ? (
          <p>Carregando…</p>
        ) : (
          <>
            <MonitorMei
              regime={empresa.regime}
              faturamentoAno={resumo.faturamentoAno}
              limiteAnualMei={Number(empresa.limiteAnualMei)}
            />
            <MonitorCustoAquisicao
              regime={empresa.regime}
              custoAquisicaoAno={resumo.custoAquisicaoAno}
              limiteAnualMei={Number(empresa.limiteAnualMei)}
            />
          </>
        )}
      </div>
    </div>
  );
}
