/**
 * ============================================================================
 * FORMULÁRIO DE PEÇA
 * ============================================================================
 * Cadastra/edita os dados da peça. Estoque (qtd) e custo NÃO são editáveis
 * aqui — eles só mudam registrando uma movimentação (ver MovimentacoesDaPeca).
 * Peça nova sempre nasce com saldo zero.
 */

import { useState } from 'react';
import { type Peca, pecaVazia, validarPeca, semErros, type ErrosValidacao } from '../types';

interface Props {
  inicial?: Peca;
  onSalvar: (p: Peca) => Promise<void> | void;
  onCancelar?: () => void;
}

export function FormPeca({ inicial, onSalvar, onCancelar }: Props) {
  const [peca, setPeca] = useState<Peca>(inicial ?? pecaVazia());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<Peca>) {
    setPeca((p) => ({ ...p, ...patch }));
  }

  async function handleSalvar() {
    const e = validarPeca(peca);
    setErros(e);
    if (!semErros(e)) return;

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
            Estoque: {peca.qtd} {peca.unidade} · Custo: R$ {peca.precoCusto.toFixed(2)}
          </span>
        )}
      </div>

      <div className="est-grid">
        <div className="est-campo est-col-2">
          <label>Nome *</label>
          <input
            value={peca.nome}
            onChange={(e) => set({ nome: e.target.value })}
            aria-invalid={!!erros.nome}
            autoFocus
          />
          {erros.nome && <span className="est-erro">{erros.nome}</span>}
        </div>

        <div className="est-campo">
          <label>Código / SKU</label>
          <input
            value={peca.codigo}
            onChange={(e) => set({ codigo: e.target.value })}
            placeholder="Opcional"
          />
        </div>

        <div className="est-campo">
          <label>Categoria</label>
          <input
            value={peca.categoria}
            onChange={(e) => set({ categoria: e.target.value })}
            placeholder="Ex.: filtros, freios…"
          />
        </div>

        <div className="est-campo">
          <label>Unidade</label>
          <input
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

        <div className="est-campo">
          <label>Preço de venda (R$)</label>
          <input
            inputMode="decimal"
            value={peca.precoVenda}
            onChange={(e) => set({ precoVenda: e.target.value })}
            placeholder="0,00"
            aria-invalid={!!erros.precoVenda}
          />
          {erros.precoVenda && <span className="est-erro">{erros.precoVenda}</span>}
        </div>

        {peca.id && (
          <div className="est-campo est-checkbox">
            <label>
              <input
                type="checkbox"
                checked={peca.ativo}
                onChange={(e) => set({ ativo: e.target.checked })}
              />
              Peça ativa
            </label>
          </div>
        )}
      </div>

      <div className="est-campo">
        <label>Descrição</label>
        <textarea
          rows={2}
          value={peca.descricao}
          onChange={(e) => set({ descricao: e.target.value })}
        />
      </div>

      <div className="est-campo">
        <label>Observações</label>
        <textarea
          rows={2}
          value={peca.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
        />
      </div>

      {!peca.id && (
        <p className="est-aviso">
          A peça nasce com estoque zero. Depois de salvar, registre uma entrada para dar
          saldo e custo a ela.
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
