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
} from '@/features/ordens-servico';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';

const OPCOES_STATUS: Array<StatusOS | 'todas'> = ['todas', 'aberta', 'em_andamento', 'concluida', 'faturada'];

export function OrdensServicoPage() {
  const [osResumo, setOsResumo] = useState<OrdemServicoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<StatusOS | 'todas'>('todas');
  const [busca, setBusca] = useState('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [osSelecionadaId, setOsSelecionadaId] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setOsResumo(await listarOS(filtroStatus === 'todas' ? {} : { status: filtroStatus }));
    } catch {
      setErro('Não foi possível carregar as ordens de serviço.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

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
    colunas: ['Nº', 'Cliente', 'Veículo', 'Status', 'Abertura'],
    linhas: filtradas.map((os) => [
      `#${os.numero}`,
      os.clienteNome,
      os.veiculoPlaca,
      ROTULO_STATUS_OS[os.status],
      os.dataAbertura ? new Date(os.dataAbertura).toLocaleDateString('pt-BR') : '—',
    ]),
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
          />
        </div>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusOS | 'todas')}>
          {OPCOES_STATUS.map((s) => (
            <option key={s} value={s}>
              {s === 'todas' ? 'Todos os status' : ROTULO_STATUS_OS[s]}
            </option>
          ))}
        </select>
      </div>

      {carregando && <p>Carregando…</p>}
      {erro && <p className="os-erro">{erro}</p>}

      {!carregando && !erro && (
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Veículo</th>
              <th>Status</th>
              <th>Abertura</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((os) => (
              <tr key={os.id}>
                <td>#{os.numero}</td>
                <td>{os.clienteNome}</td>
                <td>{os.veiculoPlaca}</td>
                <td>
                  <span className={`os-badge-status os-badge-status-${os.status}`}>
                    {ROTULO_STATUS_OS[os.status]}
                  </span>
                </td>
                <td>{os.dataAbertura && new Date(os.dataAbertura).toLocaleDateString('pt-BR')}</td>
                <td className="pg-acoes-linha">
                  <button type="button" onClick={() => setOsSelecionadaId(os.id!)}>
                    Abrir <ArrowRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={6}>Nenhuma OS encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
