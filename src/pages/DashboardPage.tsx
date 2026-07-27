/**
 * ============================================================================
 * PÁGINA — DASHBOARD
 * ============================================================================
 * Mostra o monitor de faturamento MEI de TODAS as empresas cadastradas lado
 * a lado (cada CNPJ com seu próprio limite), e os KPIs financeiros
 * detalhados de UMA empresa selecionada por vez.
 */

import { useEffect, useState } from 'react';
import { Wallet, Receipt, Scale, CalendarRange, HandCoins, FileClock, AlertTriangle } from 'lucide-react';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import {
  type ResumoDashboard,
  CartaoResumo,
  MonitorMeiEmpresa,
  buscarResumoDashboard,
} from '@/features/dashboard';

export function DashboardPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState('');
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarEmpresas() {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await listarEmpresas();
      setEmpresas(lista);
      if (lista.length > 0) setEmpresaSelecionadaId((atual) => atual || lista[0].id!);
    } catch {
      setErro('Não foi possível carregar as empresas.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  useEffect(() => {
    if (!empresaSelecionadaId) return;
    buscarResumoDashboard(empresaSelecionadaId)
      .then(setResumo)
      .catch(() => setErro('Não foi possível carregar o resumo financeiro.'));
  }, [empresaSelecionadaId]);

  if (carregando) return <p>Carregando…</p>;
  if (erro) return <p className="dash-erro">{erro}</p>;

  if (empresas.length === 0) {
    return (
      <div className="pg">
        <div className="pg-head">
          <h1>Dashboard</h1>
        </div>
        <p>
          Nenhuma empresa cadastrada ainda. Cadastre uma na aba <strong>Empresas</strong> antes de
          faturar OS/vendas e acompanhar o limite do MEI.
        </p>
      </div>
    );
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Dashboard</h1>
      </div>

      <div className="dash-monitores">
        {empresas.map((emp) => (
          <MonitorMeiEmpresa key={emp.id} empresa={emp} />
        ))}
      </div>

      <div className="pg-filtros">
        <select value={empresaSelecionadaId} onChange={(e) => setEmpresaSelecionadaId(e.target.value)}>
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nomeFantasia}
            </option>
          ))}
        </select>
      </div>

      {resumo && (
        <div className="dash-grid">
          <CartaoResumo
            titulo="Faturamento do mês"
            valor={`R$ ${resumo.faturamentoMes.toFixed(2)}`}
            icone={<Wallet size={15} />}
          />
          <CartaoResumo
            titulo="Despesas do mês"
            valor={`R$ ${resumo.despesasMes.toFixed(2)}`}
            icone={<Receipt size={15} />}
          />
          <CartaoResumo
            titulo="Resultado do mês"
            valor={`R$ ${resumo.resultadoMes.toFixed(2)}`}
            tom={resumo.resultadoMes < 0 ? 'perigo' : 'neutro'}
            icone={<Scale size={15} />}
          />
          <CartaoResumo
            titulo="Faturamento do ano"
            valor={`R$ ${resumo.faturamentoAno.toFixed(2)}`}
            icone={<CalendarRange size={15} />}
          />
          <CartaoResumo
            titulo="A receber (pendente)"
            valor={`R$ ${resumo.aReceberPendente.toFixed(2)}`}
            icone={<HandCoins size={15} />}
          />
          <CartaoResumo
            titulo="A pagar (pendente)"
            valor={`R$ ${resumo.aPagarPendente.toFixed(2)}`}
            icone={<FileClock size={15} />}
          />
          <CartaoResumo
            titulo="Contas atrasadas"
            valor={`${resumo.aPagarVencidoQtd} (R$ ${resumo.aPagarVencidoValor.toFixed(2)})`}
            tom={resumo.aPagarVencidoQtd > 0 ? 'perigo' : 'neutro'}
            icone={<AlertTriangle size={15} />}
          />
        </div>
      )}
      {resumo && resumo.resultadoMes < 0 && (
        <p className="dash-mei-mensagem">
          Despesas do mês superaram o faturamento desta empresa — não impede nada, é só um alerta.
        </p>
      )}
    </div>
  );
}
