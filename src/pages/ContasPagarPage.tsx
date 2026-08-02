/**
 * ============================================================================
 * PÁGINA — CONTAS A PAGAR
 * ============================================================================
 * Sub-aba de Financeiro (ver FinanceiroPage.tsx). Concentra as AÇÕES sobre
 * despesas (tipo='pagar'): lançar conta nova, quitar, editar valor, excluir
 * (só pendente sem vínculo) e estornar. A sub-aba "Extrato" continua sendo o
 * lugar de só OLHAR (despesas e receitas juntas, sem nenhum botão de ação) —
 * separação pedida pelo usuário pra não confundir consulta com ação.
 */

import { useEffect, useState } from 'react';
import { FilePlus2, CircleDollarSign, Pencil, Trash2, Undo2 } from 'lucide-react';
import {
  type LancamentoFinanceiro,
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
  ROTULO_FORMA_PAGAMENTO,
} from '@/features/financeiro';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { type Categoria, listarCategorias } from '@/features/categorias';
import { type ContaFinanceira, listarContasFinanceiras, ROTULO_TIPO_CONTA } from '@/features/contas-financeiras';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';
import { buscarResumoDashboard } from '@/features/dashboard';
import { useAuth } from '@/features/auth';
import { useConfirmacao } from '@/shared/hooks/useConfirmacao';
import { formatarMoeda } from '@/shared/utils/formatadores';

/** Espelha ROTULO_PERIODICIDADE de despesas/types.ts — só pra exibir a tag aqui. */
const ROTULO_PERIODICIDADE: Record<Periodicidade, string> = {
  semanal: 'Semanal',
  mensal: 'Mensal',
  anual: 'Anual',
};

type FiltroStatus = 'pendentes' | 'quitados' | 'todos';

function primeiroDiaDoMes(): string {
  const hoje = new Date();
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
}

/** yyyy-mm-dd cai no mês corrente? (só relevante pra decidir se vale a pena avisar) */
function caiNoMesAtual(dataISO: string): boolean {
  const hoje = new Date();
  const [ano, mes] = dataISO.split('-').map(Number);
  return ano === hoje.getFullYear() && mes === hoje.getMonth() + 1;
}

export function ContasPagarPage() {
  const { confirmar, avisar } = useConfirmacao();
  const { sessao, temPermissao } = useAuth();
  const meuId = sessao?.user.id;
  const podeEstornar = temPermissao('estornar_financeiro');
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('pendentes');
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('');

  const [mostrarForm, setMostrarForm] = useState(false);
  const [lancamentoParaQuitar, setLancamentoParaQuitar] = useState<LancamentoFinanceiro | null>(null);
  const [lancamentoParaEditarValor, setLancamentoParaEditarValor] = useState<LancamentoFinanceiro | null>(null);
  const [lancamentoParaEstornar, setLancamentoParaEstornar] = useState<LancamentoFinanceiro | null>(null);

  function nomeEmpresa(id: string | null): string {
    return empresas.find((e) => e.id === id)?.nomeFantasia ?? '—';
  }

  function nomeConta(id: string | null): string {
    const c = contas.find((c) => c.id === id);
    return c ? `${c.instituicao} (${ROTULO_TIPO_CONTA[c.tipo]})` : '—';
  }

  function nomeCategoria(l: LancamentoFinanceiro): string {
    return categorias.find((c) => c.chave === l.categoria)?.nome ?? l.categoria;
  }

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [lista, listaEmpresas, listaCategorias, listaContas] = await Promise.all([
        listarFinanceiro({
          tipo: 'pagar',
          pago: filtroStatus === 'todos' ? undefined : filtroStatus === 'quitados',
          empresaId: filtroEmpresa || undefined,
        }),
        listarEmpresas(),
        listarCategorias({ somenteAtivas: false }),
        listarContasFinanceiras({ somenteAtivas: false }),
      ]);
      setLancamentos(lista);
      setEmpresas(listaEmpresas);
      setCategorias(listaCategorias);
      setContas(listaContas);
    } catch {
      setErro('Não foi possível carregar as contas a pagar.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus, filtroEmpresa]);

  async function handleSalvarContaPagar(d: DadosContaPagar, pagarAgora: boolean) {
    // Empresa não é escolhida aqui — nasce "Empresa a Definir" (empresaId
    // null) e só é exigida no momento de Quitar (ver FormQuitacao).
    const novo = await criarLancamento({
      empresaId: null,
      tipo: 'pagar',
      categoria: d.categoria,
      descricao: d.descricao,
      valor: Number(d.valor),
      pago: false,
      formaPagamento: null,
      contaFinanceiraId: null,
      dataPagamento: null,
      vencimento: d.vencimento,
      clienteId: null,
      fornecedorId: d.fornecedorId || null,
      credorId: d.credorId || null,
      osId: null,
      vendaId: null,
      despesaFixaId: null,
      periodicidade: null,
      observacoes: d.observacoes,
    });
    setMostrarForm(false);
    if (pagarAgora) {
      // Vai direto pra "Registrar pagamento" com o lançamento recém-criado —
      // equivalente a criar e já clicar em "Quitar" na sequência.
      setLancamentoParaQuitar(novo);
    } else {
      await carregar();
    }
  }

  async function handleQuitar(
    formaPagamento: FormaPagamento,
    contaFinanceiraId: string,
    dataPagamento: string,
    empresaId?: string,
  ) {
    if (!lancamentoParaQuitar) return;
    const empresaEfetiva = lancamentoParaQuitar.empresaId ?? empresaId;

    if (empresaEfetiva && lancamentoParaQuitar.vencimento && caiNoMesAtual(lancamentoParaQuitar.vencimento)) {
      const resumo = await buscarResumoDashboard(empresaEfetiva, meuId);
      const projetadoResultado = resumo.resultadoMes - lancamentoParaQuitar.valor;
      if (resumo.resultadoMes >= 0 && projetadoResultado < 0) {
        const ok = await confirmar({
          titulo: 'Resultado do mês vai ficar negativo',
          tom: 'aviso',
          mensagem: `Esse pagamento deixa o resultado do mês desta empresa negativo (${formatarMoeda(projetadoResultado)}). É uma situação real de negócio, não um erro — o sistema não bloqueia, só avisa antes de quitar.`,
          textoConfirmar: 'Pagar mesmo assim',
        });
        if (!ok) return;
      }
    }

    const hoje = new Date().toISOString().slice(0, 10);
    const fluxo = await buscarFluxoCaixa(primeiroDiaDoMes(), hoje, empresaEfetiva ?? undefined, meuId);
    const projetadoCaixa = fluxo.saldoFinal - lancamentoParaQuitar.valor;
    if (fluxo.saldoFinal >= 0 && projetadoCaixa < 0) {
      const ok = await confirmar({
        titulo: 'Saldo de caixa do mês vai ficar negativo',
        tom: 'aviso',
        mensagem: `Esse pagamento deixa o saldo de caixa do mês desta empresa negativo (${formatarMoeda(projetadoCaixa)}). É uma situação real de negócio, não um erro — o sistema não bloqueia, só avisa antes de quitar.`,
        textoConfirmar: 'Pagar mesmo assim',
      });
      if (!ok) return;
    }

    await quitarLancamento(lancamentoParaQuitar.id!, formaPagamento, contaFinanceiraId, dataPagamento, empresaId);
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
      titulo: 'Excluir esta conta?',
      tom: 'perigo',
      mensagem: [
        `"${l.descricao}" — ${formatarMoeda(l.valor)} vai ser apagado definitivamente, sem deixar rastro no histórico.`,
        'Só é permitido porque ela ainda está pendente e não está vinculada a nenhuma OS/venda faturada — se já tivesse sido quitada ou tivesse vínculo, a opção seria "Estornar" em vez de excluir.',
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
          erro instanceof Error ? erro.message : 'Não foi possível excluir esta conta. Tente de novo em instantes.',
      });
    }
  }

  async function handleEstornar(dados: DadosEstorno) {
    if (!lancamentoParaEstornar) return;
    const l = lancamentoParaEstornar;
    const consequencias: string[] = [];
    if (l.pago) {
      consequencias.push(
        `Como já foi quitada, vai gerar um lançamento de contrapartida (${formatarMoeda(l.valor)}, categoria "Estorno") representando o dinheiro voltando de verdade.`,
      );
    } else {
      consequencias.push('Ainda estava pendente — só sai das contas a pagar, sem gerar contrapartida financeira.');
    }
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
        titulo="Registrar pagamento"
        precisaEmpresa={lancamentoParaQuitar.empresaId === null}
        empresaId={lancamentoParaQuitar.empresaId ?? undefined}
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
        empresaId={lancamentoParaEstornar.empresaId}
        onConfirmar={handleEstornar}
        onCancelar={() => setLancamentoParaEstornar(null)}
      />
    );
  }

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Contas a Pagar',
    subtitulo: filtroEmpresa ? empresas.find((e) => e.id === filtroEmpresa)?.nomeFantasia : 'Todas as empresas',
    colunas: [
      'Empresa',
      'Conta',
      'Categoria',
      'Descrição',
      'Valor',
      'Forma de Pagamento',
      'Data Pagamento',
      'Vencimento',
      'Status',
    ],
    linhas: lancamentos.map((l) => [
      l.empresaId === null ? 'Empresa a Definir' : nomeEmpresa(l.empresaId),
      nomeConta(l.contaFinanceiraId),
      nomeCategoria(l),
      l.descricao,
      formatarMoeda(l.valor),
      l.pago && l.formaPagamento ? ROTULO_FORMA_PAGAMENTO[l.formaPagamento] : '—',
      l.pago && l.dataPagamento ? new Date(l.dataPagamento).toLocaleDateString('pt-BR') : '—',
      l.vencimento ? new Date(l.vencimento).toLocaleDateString('pt-BR') : '—',
      l.estornado ? 'Estornado' : l.pago ? 'Quitado' : 'Pendente',
    ]),
  };

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Contas a Pagar</h1>
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
              <th>Conta</th>
              <th>Categoria</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Forma de Pagamento</th>
              <th>Data Pagamento</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lancamentos.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.empresaId === null ? (
                    <span className="fin-badge-empresa-definir">Empresa a Definir</span>
                  ) : (
                    nomeEmpresa(l.empresaId)
                  )}
                </td>
                <td>{nomeConta(l.contaFinanceiraId)}</td>
                <td>
                  {nomeCategoria(l)}
                  {l.periodicidade && <span className="fin-tag">{ROTULO_PERIODICIDADE[l.periodicidade]}</span>}
                </td>
                <td className="pg-tabela-truncar">{l.descricao}</td>
                <td>{formatarMoeda(l.valor)}</td>
                <td>{l.pago && l.formaPagamento ? ROTULO_FORMA_PAGAMENTO[l.formaPagamento] : '—'}</td>
                <td>{l.pago && l.dataPagamento ? new Date(l.dataPagamento).toLocaleDateString('pt-BR') : '—'}</td>
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
                    <button
                      type="button"
                      onClick={() => podeEstornar && setLancamentoParaEstornar(l)}
                      disabled={!podeEstornar}
                      title={podeEstornar ? undefined : 'Essa função requer permissão de estorno'}
                    >
                      <Undo2 size={13} /> Estornar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={10}>Nenhuma conta a pagar encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
