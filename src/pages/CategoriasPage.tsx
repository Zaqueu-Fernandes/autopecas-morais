/**
 * ============================================================================
 * PÁGINA — CATEGORIAS (de despesa recorrente / conta a pagar)
 * ============================================================================
 * Cadastro livre das categorias usadas em Despesas Recorrentes e Financeiro
 * (Nova conta a pagar). As 5 categorias padrão do sistema (fornecedor,
 * despesa geral, imposto, folha, retirada de lucro) vêm protegidas: dá pra
 * renomear o rótulo exibido, mas não pra desativar/excluir — têm regra de
 * negócio presa à chave interna (ver CLAUDE.md). Categorias criadas aqui
 * podem ser totalmente gerenciadas, exceto exclusão se já tiverem sido
 * usadas em algum lançamento (aí só desativar).
 * Reaproveita as classes dsp- e pg- já existentes — sem CSS próprio pra essa tela.
 */

import { useEffect, useState } from 'react';
import { Tags, Pencil, Ban, RotateCcw, Trash2, ShieldCheck } from 'lucide-react';
import {
  type Categoria,
  FormCategoria,
  listarCategorias,
  criarCategoria,
  renomearCategoria,
  definirAtivaCategoria,
  excluirCategoria,
  categoriaEmUso,
  ehViolacaoDeUnicidade,
} from '@/features/categorias';
import { type DocumentoListaImpressao, BotoesImpressaoLista } from '@/features/impressao';

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [mostrarInativas, setMostrarInativas] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<Categoria | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setCategorias(await listarCategorias({ somenteAtivas: !mostrarInativas }));
    } catch {
      setErro('Não foi possível carregar as categorias.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInativas]);

  async function handleSalvar(nome: string) {
    try {
      if (categoriaEmEdicao?.id) {
        await renomearCategoria(categoriaEmEdicao.id, nome);
      } else {
        await criarCategoria(nome);
      }
    } catch (erro) {
      if (ehViolacaoDeUnicidade(erro)) {
        throw new Error('Já existe uma categoria com esse nome (ou muito parecido).');
      }
      throw new Error('Não foi possível salvar a categoria. Tente de novo em instantes.');
    }
    setMostrarForm(false);
    setCategoriaEmEdicao(null);
    await carregar();
  }

  async function handleDesativar(id: string) {
    if (!window.confirm('Desativar esta categoria? Ela deixa de aparecer pra escolher em despesas/contas novas.'))
      return;
    await definirAtivaCategoria(id, false);
    await carregar();
  }

  async function handleReativar(id: string) {
    await definirAtivaCategoria(id, true);
    await carregar();
  }

  async function handleExcluir(categoria: Categoria) {
    if (!window.confirm('Excluir esta categoria? Essa ação não pode ser desfeita.')) return;
    if (await categoriaEmUso(categoria.chave)) {
      window.alert(
        'Esta categoria já foi usada em alguma despesa recorrente ou lançamento do Financeiro, então não pode ser excluída (perderia o histórico). Use "Desativar" pra ela parar de aparecer nas escolhas novas.',
      );
      return;
    }
    await excluirCategoria(categoria.id!);
    await carregar();
  }

  if (mostrarForm) {
    return (
      <FormCategoria
        nomeInicial={categoriaEmEdicao?.nome}
        protegida={categoriaEmEdicao?.protegida}
        onSalvar={handleSalvar}
        onCancelar={() => {
          setMostrarForm(false);
          setCategoriaEmEdicao(null);
        }}
      />
    );
  }

  const documentoImpressao: DocumentoListaImpressao = {
    titulo: 'Categorias',
    colunas: ['Nome', 'Tipo', 'Status'],
    linhas: categorias.map((c) => [
      c.nome,
      c.protegida ? 'Padrão do sistema' : 'Personalizada',
      c.ativa ? 'Ativa' : 'Inativa',
    ]),
  };

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Categorias</h1>
        <div className="pg-head-acoes">
          <BotoesImpressaoLista documento={documentoImpressao} className="dsp-btn-sec" />
          <button
            type="button"
            className="dsp-btn"
            onClick={() => {
              setCategoriaEmEdicao(null);
              setMostrarForm(true);
            }}
          >
            <Tags size={16} /> Nova categoria
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

      {carregando && <p>Carregando…</p>}
      {erro && <p className="dsp-erro">{erro}</p>}

      {!carregando && !erro && (
        <table className="pg-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id} className={!c.ativa ? 'dsp-linha-inativa' : ''}>
                <td>
                  {c.nome}
                  {c.protegida && (
                    <span className="dsp-tag-media">
                      <ShieldCheck size={11} style={{ verticalAlign: 'text-bottom', marginRight: 3 }} />
                      padrão do sistema
                    </span>
                  )}
                  {!c.ativa && <span className="dsp-tag-inativa">Inativa</span>}
                </td>
                <td className="pg-acoes-linha">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoriaEmEdicao(c);
                      setMostrarForm(true);
                    }}
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  {!c.protegida && (
                    <>
                      {c.ativa ? (
                        <button type="button" onClick={() => handleDesativar(c.id!)}>
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
                    </>
                  )}
                </td>
              </tr>
            ))}
            {categorias.length === 0 && (
              <tr>
                <td colSpan={2}>Nenhuma categoria cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
