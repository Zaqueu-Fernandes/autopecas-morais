/**
 * ============================================================================
 * MONITOR DE CUSTO DE AQUISIÇÃO DE PEÇAS
 * ============================================================================
 * Alerta antecipado do limite do MEI: venda = custo + margem de lucro, então
 * o valor de venda (o que conta pro limite de faturamento) é SEMPRE maior
 * que o custo de aquisição sozinho. Se o custo já está perto do limite
 * anual, o faturamento vai passar dele ainda mais rápido assim que essas
 * peças forem vendidas com margem em cima. Mesmo visual do Monitor de
 * faturamento MEI (reaproveita as classes dash-mei-*), só que olhando pro
 * lado da compra em vez da venda.
 */

import type { RegimeTributario } from '@/features/empresa';
import { formatarMoeda, formatarPercentual } from '@/shared/utils/formatadores';

interface Props {
  regime: RegimeTributario;
  custoAquisicaoAno: number;
  limiteAnualMei: number;
}

export function MonitorCustoAquisicao({ regime, custoAquisicaoAno, limiteAnualMei }: Props) {
  if (regime !== 'MEI') return null; // limite anual do MEI não se aplica mais — já avisado no monitor de faturamento

  const percentual = limiteAnualMei > 0 ? Math.min((custoAquisicaoAno / limiteAnualMei) * 100, 999) : 0;
  const tom = percentual >= 100 ? 'perigo' : percentual >= 80 ? 'aviso' : 'ok';

  return (
    <div className={`dash-mei dash-mei-${tom}`}>
      <div className="dash-mei-cabecalho">
        <strong>Custo de aquisição de peças</strong>
        <span>{formatarPercentual(percentual)} do limite anual</span>
      </div>
      <div className="dash-mei-barra">
        <div
          className="dash-mei-barra-preenchida"
          style={{ transform: `scaleX(${Math.min(percentual, 100) / 100})` }}
        />
      </div>
      <p className="dash-mei-detalhe">
        {formatarMoeda(custoAquisicaoAno)} em compras de peças de {formatarMoeda(limiteAnualMei)} do limite anual
      </p>
      {tom === 'perigo' && (
        <p className="dash-mei-mensagem">
          O custo de aquisição sozinho já passou do limite anual — ao vender essas peças com margem, o
          faturamento vai superar o limite ainda mais.
        </p>
      )}
      {tom === 'aviso' && (
        <p className="dash-mei-mensagem">
          Custo de aquisição perto do limite anual — lembre que o valor de venda (custo + margem) é sempre maior
          que isso.
        </p>
      )}
    </div>
  );
}
