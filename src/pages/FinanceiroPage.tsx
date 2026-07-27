/**
 * ============================================================================
 * PÁGINA — FINANCEIRO
 * ============================================================================
 * Lista lançamentos (a pagar e a receber) com filtro por tipo/status. Permite
 * lançar uma conta a pagar manual e quitar (marcar como pago/recebido)
 * qualquer lançamento pendente.
 */

import { useEffect, useState } from 'react';
import {
  type LancamentoFinanceiro,
  type TipoFinanceiro,
  type FormaPagamento,
  type DadosContaPagar,
  FormContaPagar,
  FormQuitacao,
  listarFinanceiro,
  criarLancamento,
  quitarLancamento,
  ROTULO_CATEGORIA_PAGAR,
  ROTULO_CATEGORIA_RECEBER,
} from '@/features/financeiro';

type FiltroTipo = TipoFinanceiro | 'todos';
type FiltroStatus = 'pendentes' | 'quitados' | 'todos';

function rotuloCategoria(l: LancamentoFinanceiro): string {
  return l.tipo === 'pagar'
    ? ROTULO_CATEGORIA_PAGAR[l.categoria as keyof typeof ROTULO_CATEGORIA_PAGAR]
    : ROTULO_CATEGORIA_RECEBER[l.categoria as keyof typeof ROTULO_CATEGORIA_RECEBER];
}

export function FinanceiroPage() {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('pendentes');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [lancamentoParaQuitar, setLancamentoParaQuitar] = useState<LancamentoFinanceiro | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setLancamentos(
        await listarFinanceiro({
          tipo: filtroTipo === 'todos' ? undefined : filtroTipo,
          pago: filtroStatus === 'todos' ? undefined : filtroStatus === 'quitados',
        }),
      );
    } catch {
      setErro('Não foi possível carregar o financeiro.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo, filtroStatus]);

  async function handleSalvarContaPagar(d: DadosContaPagar) {
    await criarLancamento({
      tipo: 'pagar',
      categoria: d.categoria,
      descricao: d.descricao,
      valor: Number(d.valor),
      pago: false,
      formaPagamento: null,
      dataPagamento: null,
      vencimento: d.vencimento,
      clienteId: null,
      fornecedorId: d.fornecedorId || null,
      osId: null,
      vendaId: null,
      observacoes: d.observacoes,
    });
    setMostrarForm(false);
    await carregar();
  }

  async function handleQuitar(formaPagamento: FormaPagamento) {
    if (!lancamentoParaQuitar) return;
    await quitarLancamento(lancamentoParaQuitar.id!, formaPagamento);
    setLancamentoParaQuitar(null);
    await carregar();
  }

  if (mostrarForm) {
    return <FormContaPagar onSalvar={handleSalvarContaPagar} onCancelar={() => setMostrarForm(false)} />;
  }

  if (lancamentoParaQuitar) {
    return (
      <FormQuitacao
        titulo={lancamentoParaQuitar.tipo === 'pagar' ? 'Registrar pagamento' : 'Registrar recebimento'}
        onConfirmar={handleQuitar}
        onCancelar={() => setLancamentoParaQuitar(null)}
      />
    );
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Financeiro</h1>
        <button type="button" className="fin-btn" onClick={() => setMostrarForm(true)}>
          + Nova conta a pagar
        </button>
      </div>

      <div className="pg-filtros">
        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}>
          <option value="todos">Pagar e receber</option>
          <option value="pagar">Só a pagar</option>
          <option value="receber">Só a receber</option>
        </select>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)}>
          <option value="pendentes">Pendentes</option>
          <option value="quitados">Quitados</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {carregando && <p>Carregando…</p>}
      {erro && <p className="fin-erro">{erro}</p>}

      {!carregando && !erro && (
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Categoria</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => (
              <tr key={l.id}>
                <td>
                  <span className={`fin-badge-tipo fin-badge-${l.tipo}`}>
                    {l.tipo === 'pagar' ? 'Pagar' : 'Receber'}
                  </span>
                </td>
                <td>{rotuloCategoria(l)}</td>
                <td>{l.descricao}</td>
                <td>R$ {l.valor.toFixed(2)}</td>
                <td>{l.vencimento ? new Date(l.vencimento).toLocaleDateString('pt-BR') : '—'}</td>
                <td>
                  <span className={`fin-badge-status ${l.pago ? 'fin-badge-pago' : 'fin-badge-pendente'}`}>
                    {l.pago ? 'Quitado' : 'Pendente'}
                  </span>
                </td>
                <td className="pg-acoes-linha">
                  {!l.pago && (
                    <button type="button" onClick={() => setLancamentoParaQuitar(l)}>
                      Quitar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={7}>Nenhum lançamento encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
