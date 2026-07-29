/**
 * ============================================================================
 * PÁGINA — FINANCEIRO
 * ============================================================================
 * Lista lançamentos (a pagar e a receber) com filtro por tipo/status/empresa.
 * Permite lançar uma conta a pagar manual e quitar (marcar como pago/
 * recebido) qualquer lançamento pendente.
 */

import { useEffect, useState } from 'react';
import { FilePlus2, CircleDollarSign, Pencil, Trash2, Undo2 } from 'lucide-react';
import {
  type LancamentoFinanceiro,
  type TipoFinanceiro,
  type FormaPagamento,
  type DadosContaPagar,
  type DadosEstorno,
  type Periodicidade,
  FormContaPagar,
  FormQuitacao,
  FormEditarValor,
  FormEstorno,
  listarFinanceiro,
  criarLancamento,
  quitarLancamento,
  atualizarValorLancamento,
  excluirLancamento,
  estornarLancamento,
  buscarFluxoCaixa,
  ROTULO_CATEGORIA_RECEBER,
} from '@/features/financeiro';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { type Categoria, listarCategorias } from '@/features/categorias';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';
import { buscarResumoDashboard } from '@/features/dashboard';
import { useConfirmacao } from '@/shared/hooks/useConfirmacao';
import { formatarMoeda } from '@/shared/utils/formatadores';

/** Espelha ROTULO_PERIODICIDADE de despesas/types.ts — só pra exibir a tag aqui. */
const ROTULO_PERIODICIDADE: Record<Periodicidade, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  anual: 'Anual',
};

type FiltroTipo = TipoFinanceiro | 'todos';
type FiltroStatus = 'pendentes' | 'quitados' | 'todos';

function rotuloCategoria(l: LancamentoFinanceiro, categorias: Categoria[]): string {
  if (l.tipo === 'receber')
    return ROTULO_CATEGORIA_RECEBER[l.categoria as keyof typeof ROTULO_CATEGORIA_RECEBER];
  return categorias.find((c) => c.chave === l.categoria)?.nome ?? l.categoria;
}

/** yyyy-mm-dd cai no mês corrente? (só relevante pra decidir se vale a pena avisar) */
function caiNoMesAtual(dataISO: string): boolean {
  const hoje = new Date();
  const [ano, mes] = dataISO.split('-').map(Number);
  return ano === hoje.getFullYear() && mes === hoje.getMonth() + 1;
}

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
}

export function FinanceiroPage() {
  const { confirmar, avisar } = useConfirmacao();
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('pendentes');
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [lancamentoParaQuitar, setLancamentoParaQuitar] = useState<LancamentoFinanceiro | null>(null);
  const [lancamentoParaEditarValor, setLancamentoParaEditarValor] = useState<LancamentoFinanceiro | null>(null);
  const [lancamentoParaEstornar, setLancamentoParaEstornar] = useState<LancamentoFinanceiro | null>(null);

  function nomeEmpresa(id: string | null): string {
    return empresas.find((e) => e.id === id)?.nomeFantasia ?? '—';
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [lista, listaEmpresas, listaCategorias] = await Promise.all([
        listarFinanceiro({
          tipo: filtroTipo === 'todos' ? undefined : filtroTipo,
          pago: filtroStatus === 'todos' ? undefined : filtroStatus === 'quitados',
          empresaId: filtroEmpresa || undefined,
        }),
        listarEmpresas(),
        listarCategorias({ somenteAtivas: false }),
      ]);
      setLancamentos(lista);
      setEmpresas(listaEmpresas);
      setCategorias(listaCategorias);
    } catch {
      setErro('Não foi possível carregar o financeiro.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTipo, filtroStatus, filtroEmpresa]);

  async function handleSalvarContaPagar(d: DadosContaPagar) {
    if (caiNoMesAtual(d.vencimento)) {
      const resumo = await buscarResumoDashboard(d.empresaId);
      const projetado = resumo.resultadoMes - Number(d.valor);
      if (resumo.resultadoMes >= 0 && projetado < 0) {
        const ok = await confirmar({
          titulo: 'Resultado do mês vai ficar negativo',
          tom: 'aviso',
          mensagem: `Essa conta a pagar deixa o resultado do mês desta empresa negativo (${formatarMoeda(projetado)}). É uma situação real de negócio, não um erro — o sistema não bloqueia, só avisa antes de lançar.`,
          textoConfirmar: 'Lançar mesmo assim',
        });
        if (!ok) return;
      }
    }

    await criarLancamento({
      empresaId: d.empresaId,
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
      despesaFixaId: null,
      periodicidade: null,
      observacoes: d.observacoes,
    });
    setMostrarForm(false);
    await carregar();
  }

  async function handleQuitar(formaPagamento: FormaPagamento) {
    if (!lancamentoParaQuitar) return;

    if (lancamentoParaQuitar.tipo === 'pagar') {
      const hoje = new Date().toISOString().slice(0, 10);
      const fluxo = await buscarFluxoCaixa(primeiroDiaDoMes(), hoje, lancamentoParaQuitar.empresaId ?? undefined);
      const projetado = fluxo.saldoFinal - lancamentoParaQuitar.valor;
      if (fluxo.saldoFinal >= 0 && projetado < 0) {
        const ok = await confirmar({
          titulo: 'Saldo de caixa do mês vai ficar negativo',
          tom: 'aviso',
          mensagem: `Esse pagamento deixa o saldo de caixa do mês desta empresa negativo (${formatarMoeda(projetado)}). É uma situação real de negócio, não um erro — o sistema não bloqueia, só avisa antes de quitar.`,
          textoConfirmar: 'Pagar mesmo assim',
        });
        if (!ok) return;
      }
    }

    await quitarLancamento(lancamentoParaQuitar.id!, formaPagamento);
    setLancamentoParaQuitar(null);
    await carregar();
  }

  async function handleEditarValor(novoValor: number) {
    if (!lancamentoParaEditarValor) return;
    await atualizarValorLancamento(lancamentoParaEditarValor.id!, novoValor);
    setLancamentoParaEditarValor(null);
    await carregar();
  }

  async function handleExcluir(l: LancamentoFinanceiro) {
    const ok = await confirmar({
      titulo: 'Excluir este lançamento?',
      tom: 'perigo',
      mensagem: [
        `"${l.descricao}" — ${formatarMoeda(l.valor)} vai ser apagado definitivamente, sem deixar rastro no histórico.`,
        'Só é permitido porque ele ainda está pendente e não está vinculado a nenhuma OS/venda faturada — se já tivesse sido quitado ou tivesse vínculo, a opção seria "Estornar" em vez de excluir.',
      ],
      textoConfirmar: 'Sim, excluir definitivamente',
    });
    if (!ok) return;
    try {
      await excluirLancamento(l.id!);
      await carregar();
    } catch (erro) {
      await avisar({
        titulo: 'Não foi possível excluir',
        mensagem:
          erro instanceof Error
            ? erro.message
            : 'Não foi possível excluir este lançamento. Tente de novo em instantes.',
      });
    }
  }

  async function handleEstornar(dados: DadosEstorno) {
    if (!lancamentoParaEstornar) return;
    const l = lancamentoParaEstornar;
    const consequencias: string[] = [];
    if (l.pago) {
      consequencias.push(
        `Como já foi quitado, vai gerar um lançamento de contrapartida (${formatarMoeda(l.valor)}, categoria "Estorno") representando o dinheiro saindo/voltando de verdade.`,
      );
    } else {
      consequencias.push('Ainda estava pendente — só sai das contas a pagar/receber, sem gerar contrapartida financeira.');
    }
    if (l.osId) consequencias.push('A Ordem de Serviço vinculada volta pro status "Concluída" (destrava pra edição).');
    if (l.vendaId) consequencias.push('A venda de balcão vinculada volta pro status "Aberta" (destrava pra edição).');
    consequencias.push('O lançamento original NÃO é apagado — fica marcado como estornado, preservando o histórico.');

    const ok = await confirmar({
      titulo: 'Confirmar estorno',
      tom: 'perigo',
      mensagem: [`"${l.descricao}" — ${formatarMoeda(l.valor)}.`, ...consequencias],
      textoConfirmar: 'Sim, estornar',
    });
    if (!ok) return;

    await estornarLancamento(l.id!, dados);
    setLancamentoParaEstornar(null);
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

  if (lancamentoParaEditarValor) {
    return (
      <FormEditarValor
        descricao={lancamentoParaEditarValor.descricao}
        valorAtual={lancamentoParaEditarValor.valor}
        onConfirmar={handleEditarValor}
        onCancelar={() => setLancamentoParaEditarValor(null)}
      />
    );
  }

  if (lancamentoParaEstornar) {
    return (
      <FormEstorno
        descricao={`${lancamentoParaEstornar.descricao} — ${formatarMoeda(lancamentoParaEstornar.valor)}`}
        precisaFormaPagamento={lancamentoParaEstornar.pago}
        onConfirmar={handleEstornar}
        onCancelar={() => setLancamentoParaEstornar(null)}
      />
    );
  }

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Financeiro',
    subtitulo: filtroEmpresa ? empresas.find((e) => e.id === filtroEmpresa)?.nomeFantasia : 'Todas as empresas',
    colunas: ['Empresa', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Vencimento', 'Status'],
    linhas: lancamentos.map((l) => [
      nomeEmpresa(l.empresaId),
      l.tipo === 'pagar' ? 'Pagar' : 'Receber',
      rotuloCategoria(l, categorias),
      l.descricao,
      formatarMoeda(l.valor),
      l.vencimento ? new Date(l.vencimento).toLocaleDateString('pt-BR') : '—',
      l.estornado ? 'Estornado' : l.pago ? 'Quitado' : 'Pendente',
    ]),
  };

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Financeiro</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="fin-btn-sec" />
          <button type="button" className="fin-btn" onClick={() => setMostrarForm(true)}>
            <FilePlus2 size={16} /> Nova conta a pagar
          </button>
        </div>
      </div>

      <div className="pg-filtros">
        <select
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
          aria-label="Filtrar por empresa"
        >
          <option value="">Todas as empresas</option>
          {empresas.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nomeFantasia}
            </option>
          ))}
        </select>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
          aria-label="Filtrar por tipo"
        >
          <option value="todos">Pagar e receber</option>
          <option value="pagar">Só a pagar</option>
          <option value="receber">Só a receber</option>
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)}
          aria-label="Filtrar por status"
        >
          <option value="pendentes">Pendentes</option>
          <option value="quitados">Quitados</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="fin-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && (
        <div className="pg-tabela-wrap">
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Empresa</th>
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
                <td>{nomeEmpresa(l.empresaId)}</td>
                <td>
                  <span className={`fin-badge-tipo fin-badge-${l.tipo}`}>
                    {l.tipo === 'pagar' ? 'Pagar' : 'Receber'}
                  </span>
                </td>
                <td>
                  {rotuloCategoria(l, categorias)}
                  {l.periodicidade && <span className="fin-tag">{ROTULO_PERIODICIDADE[l.periodicidade]}</span>}
                </td>
                <td className="pg-tabela-truncar">{l.descricao}</td>
                <td>{formatarMoeda(l.valor)}</td>
                <td>{l.vencimento ? new Date(l.vencimento).toLocaleDateString('pt-BR') : '—'}</td>
                <td>
                  <span
                    className={`fin-badge-status ${
                      l.estornado ? 'fin-badge-estornado' : l.pago ? 'fin-badge-pago' : 'fin-badge-pendente'
                    }`}
                  >
                    {l.estornado ? 'Estornado' : l.pago ? 'Quitado' : 'Pendente'}
                  </span>
                </td>
                <td className="pg-acoes-linha">
                  {!l.estornado && !l.pago && (
                    <>
                      <button type="button" onClick={() => setLancamentoParaEditarValor(l)}>
                        <Pencil size={13} /> Editar valor
                      </button>
                      <button type="button" onClick={() => setLancamentoParaQuitar(l)}>
                        <CircleDollarSign size={13} /> Quitar
                      </button>
                    </>
                  )}
                  {!l.estornado && !l.pago && !l.osId && !l.vendaId && (
                    <button type="button" onClick={() => handleExcluir(l)}>
                      <Trash2 size={13} /> Excluir
                    </button>
                  )}
                  {!l.estornado && (l.pago || l.osId || l.vendaId) && (
                    <button type="button" onClick={() => setLancamentoParaEstornar(l)}>
                      <Undo2 size={13} /> Estornar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={8}>Nenhum lançamento encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
