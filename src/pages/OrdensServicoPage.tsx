/**
 * ============================================================================
 * PÁGINA — ORDENS DE SERVIÇO
 * ============================================================================
 * Lista OS com filtro por status. Abrir uma OS troca pra visão de detalhe
 * (DetalheOS), que tem seus próprios itens/ações.
 */

import { useEffect, useState } from 'react';
import { Search, ClipboardPlus, ArrowRight } from 'lucide-react';
import {
  type OrdemServicoResumo,
  type StatusOS,
  ROTULO_STATUS_OS,
  FormOS,
  DetalheOS,
  listarOS,
  criarOS,
  buscarValoresPorOS,
} from '@/features/ordens-servico';
import {
  type PagamentoResumo,
  buscarLancamentosPorOS,
  buscarIdsOcultosParaUsuario,
  ROTULO_FORMA_PAGAMENTO,
} from '@/features/financeiro';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';
import { useAuth } from '@/features/auth';
import { formatarMoeda } from '@/shared/utils/formatadores';

const OPCOES_STATUS: Array<StatusOS | 'todas'> = ['todas', 'aberta', 'em_andamento', 'concluida', 'faturada'];

/** Valor só faz sentido mostrar quando já tem itens "fechados" — concluída ou faturada. */
function temValor(status: StatusOS): boolean {
  return status === 'concluida' || status === 'faturada';
}

export function OrdensServicoPage() {
  const { sessao } = useAuth();
  const meuId = sessao?.user.id;
  const [osResumo, setOsResumo] = useState<OrdemServicoResumo[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [pagamentosPorOS, setPagamentosPorOS] = useState<Record<string, PagamentoResumo>>({});
  const [valoresPorOS, setValoresPorOS] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<StatusOS | 'todas'>('todas');
  const [busca, setBusca] = useState('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [osSelecionadaId, setOsSelecionadaId] = useState<string | null>(null);

  function nomeEmpresa(id: string | null): string {
    return empresas.find((e) => e.id === id)?.nomeFantasia ?? '—';
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [lista, listaEmpresas, idsOcultos] = await Promise.all([
        listarOS(filtroStatus === 'todas' ? {} : { status: filtroStatus }),
        listarEmpresas(),
        meuId ? buscarIdsOcultosParaUsuario(meuId) : Promise.resolve(new Set<string>()),
      ]);
      const idsFaturadas = lista.filter((os) => os.status === 'faturada').map((os) => os.id!);
      const idsComValor = lista.filter((os) => temValor(os.status)).map((os) => os.id!);
      const [mapaPagamentos, mapaValores] = await Promise.all([
        buscarLancamentosPorOS(idsFaturadas),
        buscarValoresPorOS(idsComValor),
      ]);
      // Lançamento oculto pra mim (ver Ocultar Pagamentos em Dinheiro) some
      // daqui igual some do Financeiro/Fluxo de Caixa/Dashboard — a coluna
      // Empresa/Forma de Pagamento volta a mostrar "—", como se a OS ainda
      // não tivesse sido faturada.
      for (const osId of Object.keys(mapaPagamentos)) {
        if (idsOcultos.has(mapaPagamentos[osId].id)) delete mapaPagamentos[osId];
      }
      setOsResumo(lista);
      setEmpresas(listaEmpresas);
      setPagamentosPorOS(mapaPagamentos);
      setValoresPorOS(mapaValores);
    } catch {
      setErro('Não foi possível carregar as ordens de serviço.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus, meuId]);

  async function handleSalvar(os: Parameters<typeof criarOS>[0]) {
    const nova = await criarOS(os);
    setMostrarForm(false);
    await carregar();
    setOsSelecionadaId(nova.id!);
  }

  const alvo = busca.trim().toLowerCase();
  const filtradas = osResumo.filter(
    (os) =>
      !alvo ||
      os.clienteNome.toLowerCase().includes(alvo) ||
      os.veiculoPlaca.toLowerCase().includes(alvo) ||
      String(os.numero).includes(alvo),
  );

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Ordens de Serviço',
    colunas: ['Nº', 'Cliente', 'Veículo', 'Status', 'Empresa', 'Forma de Pagamento', 'Valor', 'Abertura'],
    linhas: filtradas.map((os) => {
      const pagamento = os.status === 'faturada' ? pagamentosPorOS[os.id!] : undefined;
      return [
        `#${os.numero}`,
        os.clienteNome,
        os.veiculoPlaca,
        ROTULO_STATUS_OS[os.status],
        pagamento ? nomeEmpresa(pagamento.empresaId) : '—',
        pagamento?.formaPagamento ? ROTULO_FORMA_PAGAMENTO[pagamento.formaPagamento] : '—',
        temValor(os.status) ? formatarMoeda(valoresPorOS[os.id!] ?? 0) : '—',
        os.dataAbertura ? new Date(os.dataAbertura).toLocaleDateString('pt-BR') : '—',
      ];
    }),
  };

  if (osSelecionadaId) {
    return (
      <DetalheOS
        osId={osSelecionadaId}
        aoVoltar={() => {
          setOsSelecionadaId(null);
          carregar();
        }}
      />
    );
  }

  if (mostrarForm) {
    return <FormOS onSalvar={handleSalvar} onCancelar={() => setMostrarForm(false)} />;
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Ordens de Serviço</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="os-btn-sec" />
          <button type="button" className="os-btn" onClick={() => setMostrarForm(true)}>
            <ClipboardPlus size={16} /> Nova OS
          </button>
        </div>
      </div>

      <div className="pg-filtros">
        <div className="pg-busca-wrap">
          <Search size={16} className="pg-busca-icone" />
          <input
            className="pg-busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por cliente, placa ou número…"
            aria-label="Buscar ordem de serviço"
            type="search"
            autoComplete="off"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as StatusOS | 'todas')}
          aria-label="Filtrar por status"
        >
          {OPCOES_STATUS.map((s) => (
            <option key={s} value={s}>
              {s === 'todas' ? 'Todos os status' : ROTULO_STATUS_OS[s]}
            </option>
          ))}
        </select>
      </div>

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="os-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && (
        <div className="pg-tabela-wrap">
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Veículo</th>
              <th>Status</th>
              <th>Empresa</th>
              <th>Forma de Pagamento</th>
              <th>Valor</th>
              <th>Abertura</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((os) => {
              const pagamento = os.status === 'faturada' ? pagamentosPorOS[os.id!] : undefined;
              return (
                <tr key={os.id}>
                  <td>#{os.numero}</td>
                  <td className="pg-tabela-truncar">{os.clienteNome}</td>
                  <td>{os.veiculoPlaca}</td>
                  <td>
                    <span className={`os-badge-status os-badge-status-${os.status}`}>
                      {ROTULO_STATUS_OS[os.status]}
                    </span>
                  </td>
                  <td>{pagamento ? nomeEmpresa(pagamento.empresaId) : '—'}</td>
                  <td>{pagamento?.formaPagamento ? ROTULO_FORMA_PAGAMENTO[pagamento.formaPagamento] : '—'}</td>
                  <td>{temValor(os.status) ? formatarMoeda(valoresPorOS[os.id!] ?? 0) : '—'}</td>
                  <td>{os.dataAbertura && new Date(os.dataAbertura).toLocaleDateString('pt-BR')}</td>
                  <td className="pg-acoes-linha">
                    <button type="button" onClick={() => setOsSelecionadaId(os.id!)}>
                      Abrir <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={9}>Nenhuma OS encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
