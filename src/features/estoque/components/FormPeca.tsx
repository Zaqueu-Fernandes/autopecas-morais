/**
 * ============================================================================
 * FORMULÁRIO DE PEÇA
 * ============================================================================
 * Cadastra/edita os dados da peça. qtd/preco_custo continuam sendo cache do
 * banco (nunca editados direto) — mas ao CRIAR a peça, quantidade inicial +
 * custo unitário viram a primeira movimentação de ENTRADA automaticamente
 * (ver criarPecaComEstoqueInicial em pecas.service.ts). Pra dar mais entrada
 * depois, ou ajustar, use a tela de Movimentações da peça já salva.
 *
 * "Margem de lucro (%)" é só uma calculadora: aplica sobre o custo (o
 * digitado, se for peça nova; o cacheado, se estiver editando) e sugere o
 * preço de venda — o campo continua editável manualmente depois. NÃO é
 * salva no banco (pecas não tem coluna de margem) — ao editar uma peça já
 * existente, o valor inicial do campo é CALCULADO na hora a partir de
 * precoCusto/precoVenda cacheados, pra não nascer em branco (isso é só
 * pra preencher a tela; se você editar o preço de venda na mão depois, a
 * margem mostrada não se atualiza sozinha, igual sempre foi).
 */

import { useEffect, useState } from 'react';
import { type Peca, pecaVazia, validarPeca, semErros, type ErrosValidacao } from '../types';
import { type Empresa, listarEmpresas } from '@/features/empresa';
import { formatarMoeda } from '@/shared/utils/formatadores';

interface Props {
  inicial?: Peca;
  onSalvar: (p: Peca) => Promise<void> | void;
  onCancelar?: () => void;
}

function calcularMargemAtual(custo: number, venda: number): string {
  // venda<=0 normalmente significa "preço ainda não definido" (ex.: peça
  // criada sem preço de venda), não "vendida de graça" — nesses casos não
  // faz sentido mostrar -100% (parece erro); melhor deixar em branco, igual
  // quando não há custo ainda, e deixar o usuário definir a margem/preço.
  if (custo <= 0 || venda <= 0 || Number.isNaN(venda)) return '';
  return (((venda - custo) / custo) * 100).toFixed(1);
}

export function FormPeca({ inicial, onSalvar, onCancelar }: Props) {
  const [peca, setPeca] = useState<Peca>(inicial ?? pecaVazia());
  const [margem, setMargem] = useState(() =>
    inicial?.id ? calcularMargemAtual(inicial.precoCusto, Number(inicial.precoVenda)) : '',
  );
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const ehNova = !peca.id;
  const custoBase = ehNova ? Number(peca.custoInicial || 0) : peca.precoCusto;

  useEffect(() => {
    if (!ehNova) return;
    listarEmpresas().then((lista) => {
      setEmpresas(lista);
      if (lista.length === 1) set({ empresaIdInicial: lista[0].id });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehNova]);

  function set(patch: Partial<Peca>) {
    setPeca((p) => ({ ...p, ...patch }));
  }

  function aplicarMargem(margemStr: string, custo: number) {
    const m = Number(margemStr);
    if (margemStr.trim() && !Number.isNaN(m) && custo > 0) {
      // Campo usa formato pt-BR (vírgula decimal) igual o usuário digitaria na mão.
      set({ precoVenda: (custo * (1 + m / 100)).toFixed(2).replace('.', ',') });
    }
  }

  function handleMargemChange(valor: string) {
    setMargem(valor);
    aplicarMargem(valor, custoBase);
  }

  function handleCustoInicialChange(valor: string) {
    set({ custoInicial: valor });
    if (margem.trim()) aplicarMargem(margem, Number(valor || 0));
  }

  /** Foca o primeiro campo com erro, na ordem em que aparecem no formulário. */
  function focarPrimeiroErro(e: ErrosValidacao) {
    const ordem: Array<[string, string]> = [
      ['nome', 'est-peca-nome'],
      ['qtdInicial', 'est-peca-qtd-inicial'],
      ['custoInicial', 'est-peca-custo-inicial'],
      ['empresaIdInicial', 'est-peca-empresa-inicial'],
      ['precoVenda', 'est-peca-preco-venda'],
      ['estoqueMinimo', 'est-peca-estoque-minimo'],
    ];
    const primeiro = ordem.find(([chave]) => e[chave]);
    if (primeiro) document.getElementById(primeiro[1])?.focus();
  }

  async function handleSalvar() {
    const e = validarPeca(peca);
    setErros(e);
    if (!semErros(e)) {
      focarPrimeiroErro(e);
      return;
    }

    setSalvando(true);
    try {
      await onSalvar(peca);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="est-form">
      <div className="est-form-head">
        <h2>{peca.id ? 'Editar peça' : 'Nova peça'}</h2>
        {peca.id && (
          <span className="est-tag">
            Estoque: {peca.qtd} {peca.unidade} · Custo: {formatarMoeda(peca.precoCusto)}
          </span>
        )}
      </div>

      <div className="est-grid">
        <div className="est-campo est-col-2">
          <label htmlFor="est-peca-nome">Nome *</label>
          <input
            id="est-peca-nome"
            name="nome"
            autoComplete="off"
            value={peca.nome}
            onChange={(e) => set({ nome: e.target.value })}
            aria-invalid={!!erros.nome}
            autoFocus
          />
          {erros.nome && <span className="est-erro">{erros.nome}</span>}
        </div>

        <div className="est-campo">
          <label htmlFor="est-peca-codigo">Código / SKU</label>
          <input
            id="est-peca-codigo"
            name="codigo"
            autoComplete="off"
            spellCheck={false}
            value={peca.codigo}
            onChange={(e) => set({ codigo: e.target.value })}
            placeholder="Opcional"
          />
        </div>

        <div className="est-campo">
          <label htmlFor="est-peca-categoria">Categoria</label>
          <input
            id="est-peca-categoria"
            name="categoria"
            autoComplete="off"
            value={peca.categoria}
            onChange={(e) => set({ categoria: e.target.value })}
            placeholder="Ex.: filtros, freios…"
          />
        </div>

        <div className="est-campo">
          <label htmlFor="est-peca-unidade">Unidade</label>
          <input
            id="est-peca-unidade"
            name="unidade"
            autoComplete="off"
            value={peca.unidade}
            onChange={(e) => set({ unidade: e.target.value })}
            placeholder="un, cx, litro, kg…"
            list="est-unidades"
          />
          <datalist id="est-unidades">
            <option value="un" />
            <option value="cx" />
            <option value="litro" />
            <option value="kg" />
            <option value="par" />
            <option value="metro" />
          </datalist>
        </div>

        {ehNova && (
          <>
            <div className="est-campo">
              <label htmlFor="est-peca-qtd-inicial">Quantidade inicial</label>
              <input
                id="est-peca-qtd-inicial"
                inputMode="numeric"
                value={peca.qtdInicial}
                onChange={(e) => set({ qtdInicial: e.target.value })}
                placeholder="Opcional — deixe em branco pra começar do zero"
                aria-invalid={!!erros.qtdInicial}
              />
              {erros.qtdInicial && <span className="est-erro">{erros.qtdInicial}</span>}
            </div>

            <div className="est-campo">
              <label htmlFor="est-peca-custo-inicial">
                Custo unitário (R$){peca.qtdInicial?.trim() ? ' *' : ''}
              </label>
              <input
                id="est-peca-custo-inicial"
                inputMode="decimal"
                value={peca.custoInicial}
                onChange={(e) => handleCustoInicialChange(e.target.value)}
                placeholder="0,00"
                aria-invalid={!!erros.custoInicial}
              />
              {erros.custoInicial && <span className="est-erro">{erros.custoInicial}</span>}
            </div>

            <div className="est-campo">
              <label htmlFor="est-peca-empresa-inicial">
                Empresa (CNPJ) da nota{peca.qtdInicial?.trim() ? ' *' : ''}
              </label>
              <select
                id="est-peca-empresa-inicial"
                value={peca.empresaIdInicial}
                onChange={(e) => set({ empresaIdInicial: e.target.value })}
                aria-invalid={!!erros.empresaIdInicial}
              >
                <option value="">— selecione —</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nomeFantasia}
                  </option>
                ))}
              </select>
              {erros.empresaIdInicial && <span className="est-erro">{erros.empresaIdInicial}</span>}
            </div>
          </>
        )}

        <div className="est-campo">
          <label htmlFor="est-peca-margem">Margem de lucro (%)</label>
          <input
            id="est-peca-margem"
            inputMode="decimal"
            value={margem}
            onChange={(e) => handleMargemChange(e.target.value)}
            placeholder="Ex.: 40"
            disabled={custoBase <= 0}
            aria-describedby={custoBase <= 0 ? 'est-peca-margem-ajuda' : undefined}
          />
          {custoBase <= 0 && (
            <span className="est-aviso" id="est-peca-margem-ajuda">
              {ehNova ? 'Informe o custo unitário pra calcular a partir da margem.' : 'Esta peça ainda não tem custo registrado.'}
            </span>
          )}
          {custoBase > 0 && !margem.trim() && Number(peca.precoVenda || 0) <= 0 && (
            <span className="est-aviso">
              Esta peça ainda não tem preço de venda — digite a margem desejada aqui, ou o preço direto ao lado.
            </span>
          )}
        </div>

        <div className="est-campo">
          <label htmlFor="est-peca-preco-venda">Preço de venda (R$)</label>
          <input
            id="est-peca-preco-venda"
            inputMode="decimal"
            value={peca.precoVenda}
            onChange={(e) => set({ precoVenda: e.target.value })}
            placeholder="0,00"
            aria-invalid={!!erros.precoVenda}
          />
          {erros.precoVenda && <span className="est-erro">{erros.precoVenda}</span>}
        </div>

        <div className="est-campo">
          <label htmlFor="est-peca-estoque-minimo">Estoque mínimo</label>
          <input
            id="est-peca-estoque-minimo"
            inputMode="numeric"
            value={peca.estoqueMinimo}
            onChange={(e) => set({ estoqueMinimo: e.target.value })}
            placeholder="0"
            aria-invalid={!!erros.estoqueMinimo}
            aria-describedby="est-peca-estoque-minimo-ajuda"
          />
          <span className="est-aviso" id="est-peca-estoque-minimo-ajuda">
            Abaixo desse valor, a peça aparece no alerta do Dashboard. Deixe 0 pra não monitorar.
          </span>
          {erros.estoqueMinimo && <span className="est-erro">{erros.estoqueMinimo}</span>}
        </div>

      </div>

      <div className="est-campo">
        <label htmlFor="est-peca-descricao">Descrição</label>
        <textarea
          id="est-peca-descricao"
          rows={2}
          value={peca.descricao}
          onChange={(e) => set({ descricao: e.target.value })}
        />
      </div>

      <div className="est-campo">
        <label htmlFor="est-peca-observacoes">Observações</label>
        <textarea
          id="est-peca-observacoes"
          rows={2}
          value={peca.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
        />
      </div>

      {ehNova && !peca.qtdInicial?.trim() && (
        <p className="est-aviso">
          Sem quantidade inicial, a peça nasce com estoque zero — dá pra registrar entrada
          depois, na tela de Movimentações.
        </p>
      )}

      <div className="est-acoes">
        {onCancelar && (
          <button type="button" className="est-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="est-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar peça'}
        </button>
      </div>
    </div>
  );
}
