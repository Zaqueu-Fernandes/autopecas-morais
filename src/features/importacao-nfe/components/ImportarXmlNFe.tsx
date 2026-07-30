/**
 * ============================================================================
 * IMPORTAR XML DE NF-e (entrada de estoque)
 * ============================================================================
 * Fluxo: 1) escolher o arquivo XML → 2) revisar/mapear os itens da nota pra
 * peças (existentes ou novas), com fornecedor detectado pelo CNPJ → 3)
 * confirmar: cria peças que faltam, registra uma ENTRADA por item, marca a
 * nota como importada (trava reimportação pela chave de acesso).
 */

import { useState } from 'react';
import { FileUp, Building2, CheckCircle2, RotateCcw, ArrowLeft, Loader2, Percent } from 'lucide-react';
import type { DadosNFeExtraida, MapeamentoItem, ResultadoImportacaoNFe } from '../types';
import { parseNFe } from '../services/parseNFe';
import { verificarNFeJaImportada, registrarNFeImportada } from '../services/nfeImportadas.service';
import { type Fornecedor, buscarFornecedorPorCnpj, criarFornecedor } from '@/features/cadastros';
import { type Peca, listarPecas, criarPeca, pecaVazia, registrarEntrada } from '@/features/estoque';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { formatarMoeda, paraNumero } from '@/shared/utils/formatadores';

type Etapa = 'selecionar' | 'revisar' | 'concluido';

interface Props {
  aoConcluir: () => void;
  aoCancelar: () => void;
}

export function ImportarXmlNFe({ aoConcluir, aoCancelar }: Props) {
  const [etapa, setEtapa] = useState<Etapa>('selecionar');
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [dados, setDados] = useState<DadosNFeExtraida | null>(null);
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [criandoFornecedor, setCriandoFornecedor] = useState(false);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [mapeamento, setMapeamento] = useState<MapeamentoItem[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaId, setEmpresaId] = useState('');
  const [margemGlobal, setMargemGlobal] = useState('');

  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const [resultado, setResultado] = useState<ResultadoImportacaoNFe | null>(null);

  function encontrarPecaPorCodigo(codigo: string, listaPecas: Peca[]): Peca | undefined {
    if (!codigo.trim()) return undefined;
    return listaPecas.find((p) => p.codigo.trim() && p.codigo.trim() === codigo.trim());
  }

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;

    setErro(null);
    setLendo(true);
    try {
      const texto = await arquivo.text();
      const extraido = parseNFe(texto);

      const jaImportada = await verificarNFeJaImportada(extraido.chaveAcesso);
      if (jaImportada) {
        setErro(`Esta nota (nº ${extraido.numero || '—'}) já foi importada antes.`);
        return;
      }

      const [fornecedorEncontrado, listaPecas, listaEmpresas] = await Promise.all([
        buscarFornecedorPorCnpj(extraido.fornecedorCnpj),
        listarPecas(),
        listarEmpresas(),
      ]);

      setDados(extraido);
      setFornecedor(fornecedorEncontrado);
      setPecas(listaPecas);
      setEmpresas(listaEmpresas);

      // Tenta casar o CNPJ do destinatário (dest) da nota com uma empresa
      // cadastrada; se achar, pré-seleciona — senão o usuário escolhe na mão.
      const empresaCasada = listaEmpresas.find(
        (emp) => emp.cnpj.replace(/\D/g, '') === extraido.destinatarioCnpj && extraido.destinatarioCnpj,
      );
      setEmpresaId(empresaCasada?.id ?? (listaEmpresas.length === 1 ? listaEmpresas[0].id! : ''));
      setMapeamento(
        extraido.itens.map((item) => {
          const match = encontrarPecaPorCodigo(item.codigoProduto, listaPecas);
          return {
            pecaId: match?.id ?? 'nova',
            quantidade: String(item.quantidade || 1),
            custoUnit: String(item.valorUnitario || 0),
            margem: '',
            precoVenda: '',
            incluir: true,
          };
        }),
      );
      setEtapa('revisar');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível ler este XML.');
    } finally {
      setLendo(false);
    }
  }

  function atualizarItem(indice: number, patch: Partial<MapeamentoItem>) {
    setMapeamento((lista) => lista.map((m, i) => (i === indice ? { ...m, ...patch } : m)));
  }

  /** Sugere precoVenda a partir do custo + margem — mesma calculadora do FormPeca (Nova peça). */
  function calcularPrecoVenda(custoStr: string, margemStr: string): string | null {
    const custo = paraNumero(custoStr);
    const margem = paraNumero(margemStr);
    if (!margemStr.trim() || Number.isNaN(margem) || !(custo > 0)) return null;
    return (custo * (1 + margem / 100)).toFixed(2).replace('.', ',');
  }

  function handleMargemChange(indice: number, margemStr: string, custoStr: string) {
    const sugestao = calcularPrecoVenda(custoStr, margemStr);
    atualizarItem(indice, { margem: margemStr, ...(sugestao !== null ? { precoVenda: sugestao } : {}) });
  }

  function handleCustoChange(indice: number, custoStr: string, margemAtual: string) {
    const sugestao = calcularPrecoVenda(custoStr, margemAtual);
    atualizarItem(indice, { custoUnit: custoStr, ...(sugestao !== null ? { precoVenda: sugestao } : {}) });
  }

  /**
   * Aplica a mesma margem em TODAS as peças novas de uma vez (calcula o
   * preço de venda de cada uma a partir do próprio custo). Cada campo
   * continua editável individualmente depois — isso só preenche um valor
   * inicial, não trava nada.
   */
  function aplicarMargemGlobal() {
    if (!margemGlobal.trim()) return;
    setMapeamento((lista) =>
      lista.map((m) => {
        if (m.pecaId !== 'nova') return m;
        const sugestao = calcularPrecoVenda(m.custoUnit, margemGlobal);
        return sugestao !== null ? { ...m, margem: margemGlobal, precoVenda: sugestao } : m;
      }),
    );
  }

  async function handleCadastrarFornecedor() {
    if (!dados) return;
    setCriandoFornecedor(true);
    try {
      const novo = await criarFornecedor({
        nome: dados.fornecedorNome,
        cnpj: dados.fornecedorCnpj,
        telefone: '',
        email: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        observacoes: `Cadastrado automaticamente ao importar a NF-e nº ${dados.numero}.`,
      });
      setFornecedor(novo);
    } finally {
      setCriandoFornecedor(false);
    }
  }

  async function handleConfirmarImportacao() {
    if (!dados) return;
    if (!empresaId) {
      setErro('Selecione a empresa (CNPJ) que recebeu esta nota antes de confirmar.');
      return;
    }
    const itensIncluidos = mapeamento.filter((m) => m.incluir).length;
    setImportando(true);
    setProgresso({ atual: 0, total: itensIncluidos });
    setErro(null);
    try {
      let pecasCriadas = 0;
      let entradasRegistradas = 0;

      for (let i = 0; i < dados.itens.length; i++) {
        const item = dados.itens[i];
        const map = mapeamento[i];
        if (!map.incluir) continue;

        const quantidade = paraNumero(map.quantidade);
        const custoUnit = paraNumero(map.custoUnit);
        if (!quantidade || quantidade <= 0) {
          setProgresso((p) => ({ ...p, atual: p.atual + 1 }));
          continue;
        }

        let pecaId = map.pecaId;
        if (pecaId === 'nova') {
          const nova = await criarPeca({
            ...pecaVazia(),
            codigo: item.codigoProduto,
            nome: item.descricao,
            unidade: item.unidade,
            precoVenda: map.precoVenda,
          });
          pecaId = nova.id!;
          pecasCriadas++;
        }

        await registrarEntrada({
          pecaId,
          quantidade,
          custoUnit: Number.isNaN(custoUnit) ? 0 : custoUnit,
          fornecedorId: fornecedor?.id,
          empresaId,
          observacoes: `NF-e nº ${dados.numero || '—'} (${dados.fornecedorNome})`,
        });
        entradasRegistradas++;
        setProgresso((p) => ({ ...p, atual: p.atual + 1 }));
      }

      await registrarNFeImportada({
        chaveAcesso: dados.chaveAcesso,
        numero: dados.numero,
        serie: dados.serie,
        fornecedorId: fornecedor?.id ?? null,
        valorTotal: dados.valorTotal,
      });

      setResultado({ pecasCriadas, entradasRegistradas });
      setEtapa('concluido');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha ao importar a nota.');
    } finally {
      setImportando(false);
    }
  }

  function handleReiniciar() {
    setEtapa('selecionar');
    setDados(null);
    setFornecedor(null);
    setMapeamento([]);
    setEmpresaId('');
    setMargemGlobal('');
    setProgresso({ atual: 0, total: 0 });
    setResultado(null);
    setErro(null);
  }

  if (etapa === 'concluido' && resultado) {
    return (
      <div className="nfe-form">
        <div className="nfe-concluido">
          <CheckCircle2 size={40} />
          <h2>Nota importada com sucesso</h2>
          <p>
            {resultado.pecasCriadas} peça(s) nova(s) cadastrada(s), {resultado.entradasRegistradas} entrada(s) de
            estoque registrada(s).
          </p>
        </div>
        <div className="nfe-acoes">
          <button type="button" className="est-btn-sec" onClick={handleReiniciar}>
            <RotateCcw size={15} /> Importar outra nota
          </button>
          <button type="button" className="est-btn" onClick={aoConcluir}>
            Voltar ao estoque
          </button>
        </div>
      </div>
    );
  }

  if (etapa === 'revisar' && dados && importando) {
    const pct = progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0;
    return (
      <div className="nfe-form">
        <div className="nfe-concluido">
          <Loader2 size={40} className="nfe-icone-girando" />
          <h2>Lançando Itens no Estoque</h2>
          <p>
            {progresso.atual} de {progresso.total} item(ns) processado(s)…
          </p>
          <div className="nfe-progresso-trilha">
            <div className="nfe-progresso-preenchida" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  if (etapa === 'revisar' && dados) {
    return (
      <div className="nfe-form">
        <div className="nfe-form-head">
          <h2>Revisar importação — NF-e nº {dados.numero || '—'}</h2>
          <span className="nfe-tag">Total da nota: {formatarMoeda(dados.valorTotal)}</span>
        </div>

        <div className="nfe-fornecedor">
          <Building2 size={18} />
          <div>
            <strong>{dados.fornecedorNome}</strong>
            <span>CNPJ: {dados.fornecedorCnpj || '—'}</span>
          </div>
          {fornecedor ? (
            <span className="nfe-fornecedor-status">Já cadastrado</span>
          ) : (
            <button type="button" className="est-btn-sec" onClick={handleCadastrarFornecedor} disabled={criandoFornecedor}>
              {criandoFornecedor ? 'Cadastrando…' : 'Cadastrar fornecedor'}
            </button>
          )}
        </div>

        <div className="est-campo">
          <label htmlFor="nfe-empresa">Empresa (CNPJ) que recebeu a nota *</label>
          <select
            id="nfe-empresa"
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value)}
            aria-invalid={!empresaId}
          >
            <option value="">— selecione —</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nomeFantasia}
              </option>
            ))}
          </select>
          {empresas.length === 0 && (
            <span className="est-aviso">Cadastre uma empresa na aba Empresas antes de importar.</span>
          )}
        </div>

        {erro && (
          <p className="est-erro" aria-live="polite">
            {erro}
          </p>
        )}

        {dados.itens.length > 0 && mapeamento.some((m) => m.pecaId === 'nova') && (
          <div className="nfe-margem-global">
            <Percent size={16} />
            <label htmlFor="nfe-margem-global">Aplicar margem (%) em todas as peças novas</label>
            <input
              id="nfe-margem-global"
              inputMode="decimal"
              autoComplete="off"
              value={margemGlobal}
              onChange={(e) => setMargemGlobal(e.target.value)}
              placeholder="Ex.: 40"
            />
            <button
              type="button"
              className="est-btn-sec"
              onClick={aplicarMargemGlobal}
              disabled={!margemGlobal.trim()}
            >
              Aplicar a todas
            </button>
          </div>
        )}

        {dados.itens.length === 0 ? (
          <p className="nfe-instrucao">Nenhum item pra importar — esta nota não trouxe itens.</p>
        ) : (
          <div className="nfe-tabela-wrap">
            <table className="nfe-tabela">
              <thead>
                <tr>
                  <th></th>
                  <th>Item da nota</th>
                  <th>Peça no estoque</th>
                  <th>Quantidade</th>
                  <th>Custo unit. (R$)</th>
                  <th>Margem (%)</th>
                  <th>Preço de venda (R$)</th>
                </tr>
              </thead>
              <tbody>
                {dados.itens.map((item, i) => {
                  const map = mapeamento[i];
                  if (!map) return null;
                  return (
                    <tr key={i} className={!map.incluir ? 'nfe-linha-excluida' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={map.incluir}
                          aria-label={`Incluir "${item.descricao}" na importação`}
                          onChange={(e) => atualizarItem(i, { incluir: e.target.checked })}
                        />
                      </td>
                      <td>
                        <strong>{item.descricao}</strong>
                        <br />
                        <span className="nfe-item-codigo">Cód. na nota: {item.codigoProduto || '—'}</span>
                      </td>
                      <td>
                        <select
                          value={map.pecaId}
                          disabled={!map.incluir}
                          aria-label="Peça no estoque"
                          onChange={(e) => atualizarItem(i, { pecaId: e.target.value })}
                        >
                          <option value="nova">— criar peça nova —</option>
                          {pecas.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome} {p.codigo && `(${p.codigo})`}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          inputMode="numeric"
                          name={`quantidade-${i}`}
                          autoComplete="off"
                          value={map.quantidade}
                          disabled={!map.incluir}
                          aria-label="Quantidade"
                          onChange={(e) => atualizarItem(i, { quantidade: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          inputMode="decimal"
                          name={`custo-unitario-${i}`}
                          autoComplete="off"
                          value={map.custoUnit}
                          disabled={!map.incluir}
                          aria-label="Custo unitário"
                          onChange={(e) => handleCustoChange(i, e.target.value, map.margem)}
                        />
                      </td>
                      <td>
                        {map.pecaId === 'nova' ? (
                          <input
                            inputMode="decimal"
                            name={`margem-${i}`}
                            autoComplete="off"
                            value={map.margem}
                            disabled={!map.incluir || !(paraNumero(map.custoUnit) > 0)}
                            placeholder="Ex.: 40"
                            aria-label="Margem de lucro"
                            onChange={(e) => handleMargemChange(i, e.target.value, map.custoUnit)}
                          />
                        ) : (
                          <span className="nfe-item-codigo">—</span>
                        )}
                      </td>
                      <td>
                        {map.pecaId === 'nova' ? (
                          <input
                            inputMode="decimal"
                            name={`preco-venda-${i}`}
                            autoComplete="off"
                            value={map.precoVenda}
                            disabled={!map.incluir}
                            placeholder="0,00"
                            aria-label="Preço de venda"
                            onChange={(e) => atualizarItem(i, { precoVenda: e.target.value })}
                          />
                        ) : (
                          <span className="nfe-item-codigo">
                            já tem preço — edite em Estoque se precisar mudar
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="nfe-acoes">
          <button type="button" className="est-btn-sec" onClick={aoCancelar}>
            Cancelar
          </button>
          <button type="button" className="est-btn" onClick={handleConfirmarImportacao}>
            Confirmar importação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nfe-form">
      <div className="nfe-form-head">
        <h2>Importar XML de entrada (NF-e)</h2>
      </div>

      <p className="nfe-instrucao">
        Selecione o arquivo XML da nota fiscal do fornecedor. O sistema lê os itens da nota e
        registra a entrada no estoque — não emite nada, só lê um arquivo que você já recebeu.
      </p>

      <label className="nfe-upload">
        <FileUp size={20} />
        <span>{lendo ? 'Lendo arquivo…' : 'Escolher arquivo XML'}</span>
        <input type="file" accept=".xml,text/xml" onChange={handleArquivo} disabled={lendo} hidden />
      </label>

      {erro && (
        <p className="est-erro" aria-live="polite">
          {erro}
        </p>
      )}

      <div className="nfe-acoes">
        <button type="button" className="est-btn-sec" onClick={aoCancelar}>
          <ArrowLeft size={15} /> Voltar
        </button>
      </div>
    </div>
  );
}
