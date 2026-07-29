/**
 * ============================================================================
 * PÁGINA — CONTAS FINANCEIRAS
 * ============================================================================
 * Cadastro das contas (banco/carteira/cartão/investimento) usadas pra
 * registrar onde o dinheiro entra/sai — ver CLAUDE.md, seção Financeiro.
 * Reaproveita as classes dsp- e pg- já existentes — sem CSS próprio.
 */

import { useEffect, useState } from 'react';
import { Landmark, Pencil, Ban, RotateCcw, Trash2 } from 'lucide-react';
import {
  type ContaFinanceira,
  FormContaFinanceira,
  ROTULO_TIPO_CONTA,
  listarContasFinanceiras,
  salvarContaFinanceira,
  definirAtivaContaFinanceira,
  excluirContaFinanceira,
  ehViolacaoDeReferencia,
} from '@/features/contas-financeiras';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';
import { useConfirmacao } from '@/shared/hooks/useConfirmacao';

export function ContasFinanceirasPage() {
  const { confirmar, avisar } = useConfirmacao();
  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [mostrarInativas, setMostrarInativas] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [contaEmEdicao, setContaEmEdicao] = useState<ContaFinanceira | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setContas(await listarContasFinanceiras({ somenteAtivas: !mostrarInativas }));
    } catch {
      setErro('Não foi possível carregar as contas financeiras.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInativas]);

  async function handleSalvar(c: ContaFinanceira) {
    await salvarContaFinanceira(c);
    setMostrarForm(false);
    setContaEmEdicao(null);
    await carregar();
  }

  async function handleDesativar(conta: ContaFinanceira) {
    const ok = await confirmar({
      titulo: 'Desativar esta conta financeira?',
      tom: 'aviso',
      mensagem: [
        `"${conta.instituicao}" deixa de aparecer pra escolher em pagamentos/recebimentos novos.`,
        'O histórico de lançamentos que já usam essa conta continua intacto. É reversível (ative "Mostrar inativas" pra reativar).',
      ],
      textoConfirmar: 'Desativar',
    });
    if (!ok) return;
    await definirAtivaContaFinanceira(conta.id!, false);
    await carregar();
  }

  async function handleReativar(id: string) {
    await definirAtivaContaFinanceira(id, true);
    await carregar();
  }

  async function handleExcluir(conta: ContaFinanceira) {
    const ok = await confirmar({
      titulo: 'Excluir esta conta financeira?',
      tom: 'perigo',
      mensagem: [
        `"${conta.instituicao}" vai ser apagada definitivamente.`,
        'Só funciona se ela nunca tiver sido usada em nenhum lançamento do Financeiro — se já foi usada, o banco recusa (perderia o histórico) e a alternativa é "Desativar".',
      ],
      textoConfirmar: 'Sim, excluir definitivamente',
    });
    if (!ok) return;
    try {
      await excluirContaFinanceira(conta.id!);
      await carregar();
    } catch (erro) {
      if (ehViolacaoDeReferencia(erro)) {
        await avisar({
          titulo: 'Não é possível excluir',
          mensagem: `"${conta.instituicao}" já foi usada em algum lançamento do Financeiro, então não pode ser excluída (perderia o histórico). Use "Desativar" pra ela parar de aparecer nas escolhas novas.`,
        });
        return;
      }
      throw erro;
    }
  }

  if (mostrarForm) {
    return (
      <FormContaFinanceira
        inicial={contaEmEdicao ?? undefined}
        onSalvar={handleSalvar}
        onCancelar={() => {
          setMostrarForm(false);
          setContaEmEdicao(null);
        }}
      />
    );
  }

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Contas Financeiras',
    colunas: ['Instituição', 'Tipo', 'Status'],
    linhas: contas.map((c) => [c.instituicao, ROTULO_TIPO_CONTA[c.tipo], c.ativo ? 'Ativa' : 'Inativa']),
  };

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Contas Financeiras</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="dsp-btn-sec" />
          <button
            type="button"
            className="dsp-btn"
            onClick={() => {
              setContaEmEdicao(null);
              setMostrarForm(true);
            }}
          >
            <Landmark size={16} /> Nova conta financeira
          </button>
        </div>
      </div>

      <div className="pg-filtros">
        <label className="dsp-filtro-inativas">
          <input
            type="checkbox"
            checked={mostrarInativas}
            onChange={(e) => setMostrarInativas(e.target.checked)}
          />
          Mostrar inativas
        </label>
      </div>

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="dsp-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && (
        <div className="pg-tabela-wrap">
          <table className="pg-tabela">
            <thead>
              <tr>
                <th>Instituição</th>
                <th>Tipo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contas.map((c) => (
                <tr key={c.id} className={!c.ativo ? 'dsp-linha-inativa' : ''}>
                  <td className="pg-tabela-truncar">
                    {c.instituicao}
                    {!c.ativo && <span className="dsp-tag-inativa">Inativa</span>}
                  </td>
                  <td>{ROTULO_TIPO_CONTA[c.tipo]}</td>
                  <td className="pg-acoes-linha">
                    <button
                      type="button"
                      onClick={() => {
                        setContaEmEdicao(c);
                        setMostrarForm(true);
                      }}
                    >
                      <Pencil size={13} /> Editar
                    </button>
                    {c.ativo ? (
                      <button type="button" onClick={() => handleDesativar(c)}>
                        <Ban size={13} /> Desativar
                      </button>
                    ) : (
                      <button type="button" onClick={() => handleReativar(c.id!)}>
                        <RotateCcw size={13} /> Reativar
                      </button>
                    )}
                    <button type="button" onClick={() => handleExcluir(c)}>
                      <Trash2 size={13} /> Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {contas.length === 0 && (
                <tr>
                  <td colSpan={3}>Nenhuma conta financeira cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
