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
  type PecaEstoqueBaixo,
  CartaoResumo,
  MonitorMeiEmpresa,
  buscarResumoDashboard,
  buscarPecasEstoqueBaixo,
} from '@/features/dashboard';
import { useAuth } from '@/features/auth';
import { formatarMoeda } from '@/shared/utils/formatadores';

export function DashboardPage() {
  const { sessao } = useAuth();
  const meuId = sessao?.user.id;
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState('');
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [pecasBaixo, setPecasBaixo] = useState<PecaEstoqueBaixo[]>([]);
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
    buscarPecasEstoqueBaixo().then(setPecasBaixo).catch(() => {});
  }, []);

  useEffect(() => {
    if (!empresaSelecionadaId) return;
    buscarResumoDashboard(empresaSelecionadaId, meuId)
      .then(setResumo)
      .catch(() => setErro('Não foi possível carregar o resumo financeiro.'));
  }, [empresaSelecionadaId, meuId]);

  if (carregando) return <p aria-live="polite">Carregando…</p>;
  if (erro) return <p className="dash-erro" aria-live="polite">{erro}</p>;

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

      {pecasBaixo.length > 0 && (
        <div className="dash-secao">
          <h2 className="dash-secao-titulo">Itens com estoque mínimo</h2>
          <div className="dash-cartao dash-cartao-perigo dash-estoque-baixo">
            <div className="dash-cartao-cabecalho">
              <span className="dash-cartao-titulo">Recomendação: comprar mais</span>
              <span className="dash-cartao-icone"><AlertTriangle size={15} /></span>
            </div>
            <ul className="dash-estoque-baixo-lista">
              {pecasBaixo.map((p) => (
                <li key={p.id}>
                  <span className="dash-estoque-baixo-nome">{p.nome}</span>
                  <span className="dash-estoque-baixo-qtd">{p.qtd} / mínimo {p.estoqueMinimo}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="dash-secao">
        <h2 className="dash-secao-titulo">Limite anual do MEI</h2>
        <div className="dash-monitores">
          {empresas.map((emp) => (
            <MonitorMeiEmpresa key={emp.id} empresa={emp} />
          ))}
        </div>
      </div>

      <div className="dash-secao">
        <h2 className="dash-secao-titulo">Resumo financeiro</h2>
        <div className="pg-filtros">
          <select
            value={empresaSelecionadaId}
            onChange={(e) => setEmpresaSelecionadaId(e.target.value)}
            aria-label="Filtrar por empresa"
          >
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nomeFantasia}
              </option>
            ))}
          </select>
        </div>

        {resumo && (
          <div className="dash-grid" aria-live="polite">
            <CartaoResumo
              titulo="Faturamento do mês"
              valor={formatarMoeda(resumo.faturamentoMes)}
              icone={<Wallet size={15} />}
            />
            <CartaoResumo
              titulo="Despesas do mês"
              valor={formatarMoeda(resumo.despesasMes)}
              icone={<Receipt size={15} />}
            />
            <CartaoResumo
              titulo="Resultado do mês"
              valor={formatarMoeda(resumo.resultadoMes)}
              tom={resumo.resultadoMes < 0 ? 'perigo' : 'sucesso'}
              icone={<Scale size={15} />}
            />
            <CartaoResumo
              titulo="Faturamento do ano"
              valor={formatarMoeda(resumo.faturamentoAno)}
              icone={<CalendarRange size={15} />}
            />
            <CartaoResumo
              titulo="A receber (pendente)"
              valor={formatarMoeda(resumo.aReceberPendente)}
              icone={<HandCoins size={15} />}
            />
            <CartaoResumo
              titulo="A pagar (pendente)"
              valor={formatarMoeda(resumo.aPagarPendente)}
              icone={<FileClock size={15} />}
            />
            <CartaoResumo
              titulo="Contas atrasadas"
              valor={`${resumo.aPagarVencidoQtd} (${formatarMoeda(resumo.aPagarVencidoValor)})`}
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
    </div>
  );
}
