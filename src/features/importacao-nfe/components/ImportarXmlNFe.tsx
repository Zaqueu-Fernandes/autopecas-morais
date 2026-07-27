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
import { FileUp, Building2, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';
import type { DadosNFeExtraida, MapeamentoItem, ResultadoImportacaoNFe } from '../types';
import { parseNFe } from '../services/parseNFe';
import { verificarNFeJaImportada, registrarNFeImportada } from '../services/nfeImportadas.service';
import { type Fornecedor, buscarFornecedorPorCnpj, criarFornecedor } from '@/features/cadastros';
import { type Peca, listarPecas, criarPeca, pecaVazia, registrarEntrada } from '@/features/estoque';

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

  const [importando, setImportando] = useState(false);
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

      const [fornecedorEncontrado, listaPecas] = await Promise.all([
        buscarFornecedorPorCnpj(extraido.fornecedorCnpj),
        listarPecas(),
      ]);

      setDados(extraido);
      setFornecedor(fornecedorEncontrado);
      setPecas(listaPecas);
      setMapeamento(
        extraido.itens.map((item) => {
          const match = encontrarPecaPorCodigo(item.codigoProduto, listaPecas);
          return {
            pecaId: match?.id ?? 'nova',
            quantidade: String(item.quantidade || 1),
            custoUnit: String(item.valorUnitario || 0),
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
    setImportando(true);
    setErro(null);
    try {
      let pecasCriadas = 0;
      let entradasRegistradas = 0;

      for (let i = 0; i < dados.itens.length; i++) {
        const item = dados.itens[i];
        const map = mapeamento[i];
        if (!map.incluir) continue;

        const quantidade = Number(map.quantidade);
        const custoUnit = Number(map.custoUnit);
        if (!quantidade || quantidade <= 0) continue;

        let pecaId = map.pecaId;
        if (pecaId === 'nova') {
          const nova = await criarPeca({
            ...pecaVazia(),
            codigo: item.codigoProduto,
            nome: item.descricao,
            unidade: item.unidade,
          });
          pecaId = nova.id!;
          pecasCriadas++;
        }

        await registrarEntrada({
          pecaId,
          quantidade,
          custoUnit,
          fornecedorId: fornecedor?.id,
          observacoes: `NF-e nº ${dados.numero || '—'} (${dados.fornecedorNome})`,
        });
        entradasRegistradas++;
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

  if (etapa === 'revisar' && dados) {
    return (
      <div className="nfe-form">
        <div className="nfe-form-head">
          <h2>Revisar importação — NF-e nº {dados.numero || '—'}</h2>
          <span className="nfe-tag">Total da nota: R$ {dados.valorTotal.toFixed(2)}</span>
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

        {erro && <p className="est-erro">{erro}</p>}

        <table className="nfe-tabela">
          <thead>
            <tr>
              <th></th>
              <th>Item da nota</th>
              <th>Peça no estoque</th>
              <th>Quantidade</th>
              <th>Custo unit. (R$)</th>
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
                      value={map.quantidade}
                      disabled={!map.incluir}
                      onChange={(e) => atualizarItem(i, { quantidade: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      value={map.custoUnit}
                      disabled={!map.incluir}
                      onChange={(e) => atualizarItem(i, { custoUnit: e.target.value })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="nfe-acoes">
          <button type="button" className="est-btn-sec" onClick={aoCancelar}>
            Cancelar
          </button>
          <button type="button" className="est-btn" onClick={handleConfirmarImportacao} disabled={importando}>
            {importando ? 'Importando…' : 'Confirmar importação'}
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

      {erro && <p className="est-erro">{erro}</p>}

      <div className="nfe-acoes">
        <button type="button" className="est-btn-sec" onClick={aoCancelar}>
          <ArrowLeft size={15} /> Voltar
        </button>
      </div>
    </div>
  );
}
