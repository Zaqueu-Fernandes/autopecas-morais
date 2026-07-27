/**
 * ============================================================================
 * PÁGINA — VENDAS DE BALCÃO
 * ============================================================================
 * "Nova venda" já abre uma venda vazia (balcão começa a bater os itens na
 * hora) e leva direto pro detalhe — cliente é opcional e pode ser definido
 * lá dentro.
 */

import { useEffect, useState } from 'react';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import {
  type VendaBalcaoResumo,
  DetalheVenda,
  listarVendas,
  abrirVenda,
} from '@/features/vendas';

export function VendasBalcaoPage() {
  const [vendas, setVendas] = useState<VendaBalcaoResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [vendaSelecionadaId, setVendaSelecionadaId] = useState<string | null>(null);
  const [abrindo, setAbrindo] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setVendas(await listarVendas());
    } catch {
      setErro('Não foi possível carregar as vendas.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleNovaVenda() {
    setAbrindo(true);
    try {
      const nova = await abrirVenda();
      setVendaSelecionadaId(nova.id!);
    } finally {
      setAbrindo(false);
    }
  }

  if (vendaSelecionadaId) {
    return (
      <DetalheVenda
        vendaId={vendaSelecionadaId}
        aoVoltar={() => {
          setVendaSelecionadaId(null);
          carregar();
        }}
      />
    );
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Vendas de Balcão</h1>
        <button type="button" className="vd-btn" onClick={handleNovaVenda} disabled={abrindo}>
          <ShoppingCart size={16} /> {abrindo ? 'Abrindo…' : 'Nova venda'}
        </button>
      </div>

      {carregando && <p>Carregando…</p>}
      {erro && <p className="vd-erro">{erro}</p>}

      {!carregando && !erro && (
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vendas.map((v) => (
              <tr key={v.id}>
                <td>#{v.numero}</td>
                <td>{v.clienteNome ?? 'Avulsa'}</td>
                <td>
                  <span className={`vd-badge-status vd-badge-status-${v.status}`}>
                    {v.status === 'aberta' ? 'Aberta' : 'Finalizada'}
                  </span>
                </td>
                <td className="pg-acoes-linha">
                  <button type="button" onClick={() => setVendaSelecionadaId(v.id!)}>
                    Abrir <ArrowRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {vendas.length === 0 && (
              <tr>
                <td colSpan={4}>Nenhuma venda encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
