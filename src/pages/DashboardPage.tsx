/**
 * ============================================================================
 * PÁGINA — DASHBOARD
 * ============================================================================
 * Visão geral: monitor de faturamento MEI + KPIs de financeiro. Se a empresa
 * ainda não foi configurada, pede pra configurar antes (regime é essencial
 * pro monitor).
 */

import { useEffect, useState } from 'react';
import {
  type ConfigEmpresa,
  configEmpresaVazia,
  FormConfigEmpresa,
  buscarConfigEmpresa,
  salvarConfigEmpresa,
} from '@/features/empresa';
import { type ResumoDashboard, CartaoResumo, MonitorMei, buscarResumoDashboard } from '@/features/dashboard';

export function DashboardPage() {
  const [config, setConfig] = useState<ConfigEmpresa | null>(null);
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarConfig, setMostrarConfig] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [cfg, res] = await Promise.all([buscarConfigEmpresa(), buscarResumoDashboard()]);
      setConfig(cfg);
      setResumo(res);
    } catch {
      setErro('Não foi possível carregar o dashboard.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSalvarConfig(c: ConfigEmpresa) {
    await salvarConfigEmpresa(c);
    setMostrarConfig(false);
    await carregar();
  }

  if (carregando) return <p>Carregando…</p>;
  if (erro) return <p className="dash-erro">{erro}</p>;

  if (!config || mostrarConfig) {
    return (
      <div className="pg">
        {!config && <p>Configure sua empresa antes de continuar.</p>}
        <FormConfigEmpresa
          inicial={config ?? configEmpresaVazia()}
          onSalvar={handleSalvarConfig}
          onCancelar={config ? () => setMostrarConfig(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Dashboard</h1>
        <button type="button" className="emp-btn-sec" onClick={() => setMostrarConfig(true)}>
          Configurar empresa
        </button>
      </div>

      <MonitorMei
        regime={config.regime}
        faturamentoAno={resumo!.faturamentoAno}
        limiteAnualMei={Number(config.limiteAnualMei)}
      />

      <div className="dash-grid">
        <CartaoResumo titulo="Faturamento do mês" valor={`R$ ${resumo!.faturamentoMes.toFixed(2)}`} />
        <CartaoResumo titulo="Faturamento do ano" valor={`R$ ${resumo!.faturamentoAno.toFixed(2)}`} />
        <CartaoResumo titulo="A receber (pendente)" valor={`R$ ${resumo!.aReceberPendente.toFixed(2)}`} />
        <CartaoResumo titulo="A pagar (pendente)" valor={`R$ ${resumo!.aPagarPendente.toFixed(2)}`} />
        <CartaoResumo
          titulo="Contas atrasadas"
          valor={`${resumo!.aPagarVencidoQtd} (R$ ${resumo!.aPagarVencidoValor.toFixed(2)})`}
          tom={resumo!.aPagarVencidoQtd > 0 ? 'perigo' : 'neutro'}
        />
      </div>
    </div>
  );
}
