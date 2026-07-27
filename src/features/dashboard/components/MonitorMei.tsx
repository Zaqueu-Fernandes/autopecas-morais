/**
 * ============================================================================
 * MONITOR DE FATURAMENTO MEI
 * ============================================================================
 * Mostra o quanto do limite anual do MEI já foi usado. Some/avisa conforme o
 * regime da empresa (só faz sentido pra quem ainda é MEI).
 */

import type { RegimeTributario } from '@/features/empresa';

interface Props {
  regime: RegimeTributario;
  faturamentoAno: number;
  limiteAnualMei: number;
}

export function MonitorMei({ regime, faturamentoAno, limiteAnualMei }: Props) {
  if (regime !== 'MEI') {
    return (
      <div className="dash-mei dash-mei-me">
        <strong>Regime atual: ME (Simples Nacional)</strong>
        <p>O limite anual do MEI não se aplica mais a este negócio.</p>
      </div>
    );
  }

  const percentual = limiteAnualMei > 0 ? Math.min((faturamentoAno / limiteAnualMei) * 100, 999) : 0;
  const tom = percentual >= 100 ? 'perigo' : percentual >= 80 ? 'aviso' : 'ok';

  return (
    <div className={`dash-mei dash-mei-${tom}`}>
      <div className="dash-mei-cabecalho">
        <strong>Monitor de faturamento MEI</strong>
        <span>{percentual.toFixed(0)}% do limite anual</span>
      </div>
      <div className="dash-mei-barra">
        <div className="dash-mei-barra-preenchida" style={{ width: `${Math.min(percentual, 100)}%` }} />
      </div>
      <p className="dash-mei-detalhe">
        R$ {faturamentoAno.toFixed(2)} faturados de R$ {limiteAnualMei.toFixed(2)} permitidos este ano
      </p>
      {tom === 'perigo' && (
        <p className="dash-mei-mensagem">
          Limite do MEI ultrapassado — procure um contador pra avaliar a migração pra ME.
        </p>
      )}
      {tom === 'aviso' && (
        <p className="dash-mei-mensagem">Chegando perto do limite anual — fique de olho.</p>
      )}
    </div>
  );
}
