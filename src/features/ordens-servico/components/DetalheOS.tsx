/**
 * ============================================================================
 * DETALHE DE UMA OS
 * ============================================================================
 * Cabeçalho com cliente/veículo/status, botão de avançar status, faturamento
 * (quando concluída) e os itens. OS faturada trava a edição dos itens.
 */

import { useEffect, useState } from 'react';
import { ROTULO_STATUS_OS, PROXIMO_STATUS, type OrdemServicoResumo } from '../types';
import { buscarOSPorId, avancarStatusOS } from '../services/os.service';
import { ListaItensOS } from './ListaItensOS';
import { FormFaturamento } from '@/features/financeiro';

interface Props {
  osId: string;
  aoVoltar: () => void;
}

export function DetalheOS({ osId, aoVoltar }: Props) {
  const [os, setOs] = useState<OrdemServicoResumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [avancando, setAvancando] = useState(false);
  const [mostrarFaturamento, setMostrarFaturamento] = useState(false);
  const [totalOS, setTotalOS] = useState(0);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setOs(await buscarOSPorId(osId));
    } catch {
      setErro('Não foi possível carregar esta OS.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [osId]);

  async function handleAvancar() {
    if (!os) return;
    setAvancando(true);
    try {
      const atualizada = await avancarStatusOS(os.id!, os.status);
      setOs({ ...os, ...atualizada });
    } finally {
      setAvancando(false);
    }
  }

  async function handleFaturado() {
    setMostrarFaturamento(false);
    await carregar();
  }

  if (carregando) return <p>Carregando…</p>;
  if (erro || !os) return <p className="os-erro">{erro ?? 'OS não encontrada.'}</p>;

  const proximoStatus = PROXIMO_STATUS[os.status];
  const podeFaturar = os.status === 'concluida';
  const bloqueado = os.status === 'faturada';

  return (
    <div className="os-detalhe">
      <button type="button" className="os-voltar" onClick={aoVoltar}>
        ← Voltar
      </button>

      <div className="os-detalhe-head">
        <div>
          <h1>OS #{os.numero}</h1>
          <p className="os-detalhe-sub">
            {os.clienteNome} — {os.veiculoPlaca} {os.veiculoMarcaModelo}
          </p>
        </div>
        <div className="os-detalhe-status">
          <span className={`os-badge-status os-badge-status-${os.status}`}>
            {ROTULO_STATUS_OS[os.status]}
          </span>
          {proximoStatus && (
            <button type="button" className="os-btn" onClick={handleAvancar} disabled={avancando}>
              {avancando ? 'Avançando…' : `Avançar para ${ROTULO_STATUS_OS[proximoStatus]}`}
            </button>
          )}
          {podeFaturar && !mostrarFaturamento && (
            <button type="button" className="os-btn" onClick={() => setMostrarFaturamento(true)}>
              Faturar OS
            </button>
          )}
        </div>
      </div>

      <div className="os-detalhe-info">
        <div>
          <label>Problema relatado</label>
          <p>{os.descricaoProblema || '—'}</p>
        </div>
        {os.observacoes && (
          <div>
            <label>Observações</label>
            <p>{os.observacoes}</p>
          </div>
        )}
      </div>

      {mostrarFaturamento ? (
        <FormFaturamento
          osId={os.id!}
          clienteId={os.clienteId}
          valorTotal={totalOS}
          onFaturado={handleFaturado}
          onCancelar={() => setMostrarFaturamento(false)}
        />
      ) : (
        <ListaItensOS osId={os.id!} bloqueado={bloqueado} aoAtualizarTotal={setTotalOS} />
      )}
    </div>
  );
}
