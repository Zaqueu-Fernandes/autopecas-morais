/**
 * ============================================================================
 * PÁGINA — CONTAS A RECEBER
 * ============================================================================
 * Sub-aba de Financeiro (ver FinanceiroPage.tsx). Concentra as AÇÕES sobre
 * receitas (tipo='receber'): lançar receita avulsa (ver FormContaReceber —
 * fora do fluxo normal, que é OS faturada/venda finalizada), quitar, editar
 * valor, excluir e estornar. A sub-aba "Extrato" continua sendo o lugar de
 * só OLHAR (despesas e receitas juntas, sem nenhum botão de ação) —
 * separação pedida pelo usuário pra não confundir consulta com ação.
 */

import { useEffect, useState } from 'react';
import { FilePlus2, CircleDollarSign, Pencil, Trash2, Undo2 } from 'lucide-react';
import {
  type LancamentoFinanceiro,
  type FormaPagamento,
  type DadosContaReceber,
  type DadosEstorno,
  FormContaReceber,
  FormQuitacao,
  FormEditarValor,
  FormEstorno,
  listarFinanceiro,
  criarLancamento,
  quitarLancamento,
  atualizarValorLancamento,
  excluirLancamento,
  estornarLancamento,
  buscarIdsOcultosParaUsuario,
  buscarTodasOcultacoes,
  ROTULO_CATEGORIA_RECEBER,
  ROTULO_FORMA_PAGAMENTO,
} from '@/features/financeiro';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { type ContaFinanceira, listarContasFinanceiras, ROTULO_TIPO_CONTA } from '@/features/contas-financeiras';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';
import { useAuth } from '@/features/auth';
import { useConfirmacao } from '@/shared/hooks/useConfirmacao';
import { formatarMoeda } from '@/shared/utils/formatadores';

type FiltroStatus = 'pendentes' | 'quitados' | 'todos';

function nomeCategoriaReceber(l: LancamentoFinanceiro): string {
  return ROTULO_CATEGORIA_RECEBER[l.categoria as keyof typeof ROTULO_CATEGORIA_RECEBER];
}

/**
 * Vencimento nulo tem 2 causas bem diferentes (ver "3 situações de
 * recebimento" em Faturamento, CLAUDE.md): à vista, que já foi pago na hora
 * e nunca teve vencimento — não tem o que rotular; ou fiado ("Em aberto"),
 * pendente sem data marcada, amarrado ao cliente até ele pagar. Só o
 * segundo caso ganha o rótulo "Em Aberto"; o primeiro continua "—".
 */
function rotuloVencimento(l: LancamentoFinanceiro): string {
  if (l.vencimento) return new Date(l.vencimento).toLocaleDateString('pt-BR');
  if (!l.pago && !l.estornado) return 'Em Aberto';
  return '—';
}

export function ContasReceberPage() {
  const { confirmar, avisar } = useConfirmacao();
  const { sessao, ehAdmin, temPermissao } = useAuth();
  const meuId = sessao?.user.id;
  const podeEstornar = temPermissao('estornar_financeiro');
  const [lancamentosCompletos, setLancamentosCompletos] = useState<LancamentoFinanceiro[]>([]);
  const [idsOcultosParaMim, setIdsOcultosParaMim] = useState<Set<string>>(new Set());
  const [mapaOcultacoes, setMapaOcultacoes] = useState<Record<string, string[]>>({});
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('pendentes');
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('');
  const [mostrarOcultos, setMostrarOcultos] = useState(false);

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

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const [lista, listaEmpresas, listaContas, idsOcultos, mapaOcultacoesCarregado] = await Promise.all([
        listarFinanceiro({
          tipo: 'receber',
          pago: filtroStatus === 'todos' ? undefined : filtroStatus === 'quitados',
          empresaId: filtroEmpresa || undefined,
        }),
        listarEmpresas(),
        listarContasFinanceiras({ somenteAtivas: false }),
        meuId ? buscarIdsOcultosParaUsuario(meuId) : Promise.resolve(new Set<string>()),
        ehAdmin ? buscarTodasOcultacoes() : Promise.resolve({}),
      ]);
      setLancamentosCompletos(lista);
      setEmpresas(listaEmpresas);
      setContas(listaContas);
      setIdsOcultosParaMim(idsOcultos);
      setMapaOcultacoes(mapaOcultacoesCarregado);
    } catch {
      setErro('Não foi possível carregar as contas a receber.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus, filtroEmpresa]);

  async function handleSalvarContaReceber(d: DadosContaReceber) {
    // Empresa não é escolhida aqui — nasce "Empresa a Definir" (empresaId
    // null) e só é exigida no momento de Quitar (ver FormQuitacao). Categoria
    // é sempre 'receita_avulsa' — servico_os/venda_balcao continuam só
    // nascendo do faturamento automático.
    await criarLancamento({
      empresaId: null,
      tipo: 'receber',
      categoria: 'receita_avulsa',
      descricao: d.descricao,
      valor: Number(d.valor),
      pago: false,
      formaPagamento: null,
      contaFinanceiraId: null,
      dataPagamento: null,
      vencimento: d.vencimento,
      clienteId: d.clienteId || null,
      fornecedorId: null,
      osId: null,
      vendaId: null,
      despesaFixaId: null,
      periodicidade: null,
      observacoes: d.observacoes,
    });
    setMostrarForm(false);
    await carregar();
  }

  async function handleQuitar(
    formaPagamento: FormaPagamento,
    contaFinanceiraId: string,
    dataPagamento: string,
    empresaId?: string,
  ) {
    if (!lancamentoParaQuitar) return;
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
        `Como já foi recebida, vai gerar um lançamento de contrapartida (${formatarMoeda(l.valor)}, categoria "Estorno") representando o dinheiro voltando de verdade.`,
      );
    } else {
      consequencias.push('Ainda estava pendente — só sai das contas a receber, sem gerar contrapartida financeira.');
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
    return <FormContaReceber onSalvar={handleSalvarContaReceber} onCancelar={() => setMostrarForm(false)} />;
  }

  if (lancamentoParaQuitar) {
    return (
      <FormQuitacao
        titulo="Registrar recebimento"
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

  // O que EU vejo: todo lançamento, menos os que estão ocultos pra mim
  // especificamente (ver financeiro_ocultacoes). É essa lista — nunca a
  // completa — que alimenta o relatório impresso/PDF, mesmo quando admin
  // está com "Mostrar ocultos" ligado pra gerenciar a tabela na tela.
  const lancamentosVisiveisParaMim = lancamentosCompletos.filter((l) => !idsOcultosParaMim.has(l.id!));
  const lancamentos = ehAdmin && mostrarOcultos ? lancamentosCompletos : lancamentosVisiveisParaMim;

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Contas a Receber',
    subtitulo: filtroEmpresa ? empresas.find((e) => e.id === filtroEmpresa)?.nomeFantasia : 'Todas as empresas',
    colunas: ['Empresa', 'Conta', 'Categoria', 'Descrição', 'Valor', 'Vencimento', 'Status'],
    linhas: lancamentosVisiveisParaMim.map((l) => [
      l.empresaId === null ? 'Empresa a Definir' : nomeEmpresa(l.empresaId),
      nomeConta(l.contaFinanceiraId),
      nomeCategoriaReceber(l),
      l.descricao,
      formatarMoeda(l.valor),
      rotuloVencimento(l),
      l.estornado ? 'Estornado' : l.pago ? 'Quitado' : 'Pendente',
    ]),
  };

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Contas a Receber</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="fin-btn-sec" />
          <button type="button" className="fin-btn" onClick={() => setMostrarForm(true)}>
            <FilePlus2 size={16} /> Nova conta a receber
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
        {ehAdmin && (
          <label className="fin-filtro-ocultos">
            <input type="checkbox" checked={mostrarOcultos} onChange={(e) => setMostrarOcultos(e.target.checked)} />
            Mostrar ocultos
          </label>
        )}
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
            {lancamentos.map((l) => {
              const usuariosQueOcultam = mapaOcultacoes[l.id!] ?? [];
              return (
                <tr key={l.id} className={idsOcultosParaMim.has(l.id!) ? 'fin-linha-oculta' : undefined}>
                  <td>
                    {l.empresaId === null ? (
                      <span className="fin-badge-empresa-definir">Empresa a Definir</span>
                    ) : (
                      nomeEmpresa(l.empresaId)
                    )}
                  </td>
                  <td>{nomeConta(l.contaFinanceiraId)}</td>
                  <td>{nomeCategoriaReceber(l)}</td>
                  <td className="pg-tabela-truncar">{l.descricao}</td>
                  <td>{formatarMoeda(l.valor)}</td>
                  <td>{l.pago && l.formaPagamento ? ROTULO_FORMA_PAGAMENTO[l.formaPagamento] : '—'}</td>
                  <td>{l.pago && l.dataPagamento ? new Date(l.dataPagamento).toLocaleDateString('pt-BR') : '—'}</td>
                  <td>{rotuloVencimento(l)}</td>
                  <td>
                    <span
                      className={`fin-badge-status ${
                        l.estornado ? 'fin-badge-estornado' : l.pago ? 'fin-badge-pago' : 'fin-badge-pendente'
                      }`}
                    >
                      {l.estornado ? 'Estornado' : l.pago ? 'Quitado' : 'Pendente'}
                    </span>
                    {ehAdmin && usuariosQueOcultam.length > 0 && (
                      <span className="fin-badge-oculto">
                        Oculto p/ {usuariosQueOcultam.length} usuário{usuariosQueOcultam.length > 1 ? 's' : ''}
                      </span>
                    )}
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
              );
            })}
            {lancamentos.length === 0 && (
              <tr>
                <td colSpan={10}>Nenhuma conta a receber encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
