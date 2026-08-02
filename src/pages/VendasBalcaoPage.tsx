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
import {
  type PagamentoResumo,
  buscarLancamentosPorVenda,
  buscarIdsOcultosParaUsuario,
  ROTULO_FORMA_PAGAMENTO,
} from '@/features/financeiro';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';
import { formatarMoeda } from '@/shared/utils/formatadores';
import { useAuth } from '@/features/auth';

type PagamentoVenda = PagamentoResumo & { valor: number };

export function VendasBalcaoPage() {
  const { sessao } = useAuth();
  const meuId = sessao?.user.id;
  const [vendas, setVendas] = useState<VendaBalcaoResumo[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [pagamentosPorVenda, setPagamentosPorVenda] = useState<Record<string, PagamentoVenda>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [vendaSelecionadaId, setVendaSelecionadaId] = useState<string | null>(null);
  const [abrindo, setAbrindo] = useState(false);

  function nomeEmpresa(id: string | null): string {
    return empresas.find((e) => e.id === id)?.nomeFantasia ?? '—';
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [lista, listaEmpresas, idsOcultos] = await Promise.all([
        listarVendas(),
        listarEmpresas(),
        meuId ? buscarIdsOcultosParaUsuario(meuId) : Promise.resolve(new Set<string>()),
      ]);
      const idsFinalizadas = lista.filter((v) => v.status === 'finalizada').map((v) => v.id!);
      const mapaPagamentos = await buscarLancamentosPorVenda(idsFinalizadas);
      // Mesma regra do Financeiro/Fluxo de Caixa/Dashboard: lançamento oculto
      // pra mim some daqui também — Valor/Empresa/Forma de Pagamento voltam a
      // mostrar "—", como se a venda ainda não tivesse sido finalizada.
      for (const vendaId of Object.keys(mapaPagamentos)) {
        if (idsOcultos.has(mapaPagamentos[vendaId].id)) delete mapaPagamentos[vendaId];
      }
      setVendas(lista);
      setEmpresas(listaEmpresas);
      setPagamentosPorVenda(mapaPagamentos);
    } catch {
      setErro('Não foi possível carregar as vendas.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meuId]);

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

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Vendas de Balcão',
    colunas: ['Nº', 'Cliente', 'Status', 'Valor', 'Empresa', 'Forma de Pagamento'],
    linhas: vendas.map((v) => {
      const pagamento = v.status === 'finalizada' ? pagamentosPorVenda[v.id!] : undefined;
      return [
        `#${v.numero}`,
        v.clienteNome ?? 'Avulsa',
        v.status === 'aberta' ? 'Aberta' : 'Finalizada',
        pagamento ? formatarMoeda(pagamento.valor) : '—',
        pagamento ? nomeEmpresa(pagamento.empresaId) : '—',
        pagamento?.formaPagamento ? ROTULO_FORMA_PAGAMENTO[pagamento.formaPagamento] : '—',
      ];
    }),
  };

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Vendas de Balcão</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="vd-btn-sec" />
          <button type="button" className="vd-btn" onClick={handleNovaVenda} disabled={abrindo}>
            <ShoppingCart size={16} /> {abrindo ? 'Abrindo…' : 'Nova venda'}
          </button>
        </div>
      </div>

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="vd-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && (
        <div className="pg-tabela-wrap">
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Empresa</th>
              <th>Forma de Pagamento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vendas.map((v) => {
              const pagamento = v.status === 'finalizada' ? pagamentosPorVenda[v.id!] : undefined;
              return (
                <tr key={v.id}>
                  <td>#{v.numero}</td>
                  <td className="pg-tabela-truncar">{v.clienteNome ?? 'Avulsa'}</td>
                  <td>
                    <span className={`vd-badge-status vd-badge-status-${v.status}`}>
                      {v.status === 'aberta' ? 'Aberta' : 'Finalizada'}
                    </span>
                  </td>
                  <td>{pagamento ? formatarMoeda(pagamento.valor) : '—'}</td>
                  <td>{pagamento ? nomeEmpresa(pagamento.empresaId) : '—'}</td>
                  <td>{pagamento?.formaPagamento ? ROTULO_FORMA_PAGAMENTO[pagamento.formaPagamento] : '—'}</td>
                  <td className="pg-acoes-linha">
                    <button type="button" onClick={() => setVendaSelecionadaId(v.id!)}>
                      Abrir <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {vendas.length === 0 && (
              <tr>
                <td colSpan={7}>Nenhuma venda encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
