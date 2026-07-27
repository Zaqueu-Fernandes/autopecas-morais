/**
 * ============================================================================
 * DETALHE DE UMA VENDA DE BALCÃO
 * ============================================================================
 * Cliente é opcional e pode ser definido/trocado aqui (só é obrigatório se a
 * venda for finalizada como a_prazo/fiado). Itens e finalização, como na OS.
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, Receipt } from 'lucide-react';
import type { VendaBalcaoResumo } from '../types';
import { buscarVendaPorId, definirClienteVenda } from '../services/vendas.service';
import { ListaItensVenda } from './ListaItensVenda';
import { FormFinalizarVenda } from '@/features/financeiro';
import { type Cliente, listarClientes } from '@/features/cadastros';

interface Props {
  vendaId: string;
  aoVoltar: () => void;
}

export function DetalheVenda({ vendaId, aoVoltar }: Props) {
  const [venda, setVenda] = useState<VendaBalcaoResumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarFinalizacao, setMostrarFinalizacao] = useState(false);
  const [totalVenda, setTotalVenda] = useState(0);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setVenda(await buscarVendaPorId(vendaId));
    } catch {
      setErro('Não foi possível carregar esta venda.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    listarClientes().then(setClientes).catch(() => setClientes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendaId]);

  async function handleTrocarCliente(clienteId: string) {
    if (!venda) return;
    const atualizada = await definirClienteVenda(venda.id!, clienteId || null);
    const nomeCliente = clientes.find((c) => c.id === clienteId)?.nome ?? null;
    setVenda({ ...venda, ...atualizada, clienteNome: nomeCliente });
  }

  async function handleFinalizada() {
    setMostrarFinalizacao(false);
    await carregar();
  }

  if (carregando) return <p>Carregando…</p>;
  if (erro || !venda) return <p className="vd-erro">{erro ?? 'Venda não encontrada.'}</p>;

  const bloqueado = venda.status === 'finalizada';

  return (
    <div className="vd-detalhe">
      <button type="button" className="vd-voltar" onClick={aoVoltar}>
        <ArrowLeft size={15} /> Voltar
      </button>

      <div className="vd-detalhe-head">
        <div>
          <h1>Venda #{venda.numero}</h1>
        </div>
        <div className="vd-detalhe-status">
          <span className={`vd-badge-status vd-badge-status-${venda.status}`}>
            {venda.status === 'aberta' ? 'Aberta' : 'Finalizada'}
          </span>
          {!bloqueado && !mostrarFinalizacao && (
            <button type="button" className="vd-btn" onClick={() => setMostrarFinalizacao(true)}>
              <Receipt size={16} /> Finalizar venda
            </button>
          )}
        </div>
      </div>

      <div className="vd-campo vd-cliente">
        <label>Cliente (opcional — obrigatório para a prazo/fiado)</label>
        <select value={venda.clienteId ?? ''} onChange={(e) => handleTrocarCliente(e.target.value)} disabled={bloqueado}>
          <option value="">— venda avulsa, sem cliente —</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {mostrarFinalizacao ? (
        <FormFinalizarVenda
          vendaId={venda.id!}
          clienteId={venda.clienteId}
          valorTotal={totalVenda}
          onFinalizada={handleFinalizada}
          onCancelar={() => setMostrarFinalizacao(false)}
        />
      ) : (
        <ListaItensVenda vendaId={venda.id!} bloqueado={bloqueado} aoAtualizarTotal={setTotalVenda} />
      )}
    </div>
  );
}
