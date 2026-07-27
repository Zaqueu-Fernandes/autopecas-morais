/**
 * ============================================================================
 * FORMULÁRIO DE ITEM DA OS — PEÇA ou SERVIÇO
 * ============================================================================
 * Peça: seleciona do estoque, mostra saldo disponível. A baixa de verdade
 * acontece no service (adicionarItemPeca) — aqui só validamos o básico.
 * Serviço: descrição livre + valor (mão de obra), não mexe em estoque.
 */

import { useEffect, useState } from 'react';
import {
  type DadosItemPeca,
  type DadosItemServico,
  dadosItemPecaVazio,
  dadosItemServicoVazio,
  validarItemPeca,
  validarItemServico,
  semErros,
  type ErrosValidacao,
} from '../types';
import { type Peca, listarPecas } from '@/features/estoque';

interface PropsPeca {
  tipo: 'peca';
  onSalvar: (d: DadosItemPeca, peca: Peca) => Promise<void> | void;
  onCancelar?: () => void;
}

interface PropsServico {
  tipo: 'servico';
  onSalvar: (d: DadosItemServico) => Promise<void> | void;
  onCancelar?: () => void;
}

type Props = PropsPeca | PropsServico;

export function FormItemOS(props: Props) {
  if (props.tipo === 'peca') return <FormPeca {...props} />;
  return <FormServico {...props} />;
}

function FormPeca({ onSalvar, onCancelar }: PropsPeca) {
  const [dados, setDados] = useState<DadosItemPeca>(dadosItemPecaVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);
  const [pecas, setPecas] = useState<Peca[]>([]);

  useEffect(() => {
    listarPecas().then(setPecas).catch(() => setPecas([]));
  }, []);

  const pecaSelecionada = pecas.find((p) => p.id === dados.pecaId) ?? null;

  function set(patch: Partial<DadosItemPeca>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleSalvar() {
    const e = validarItemPeca(dados);
    if (!e.quantidade && pecaSelecionada && Number(dados.quantidade) > pecaSelecionada.qtd) {
      e.quantidade = `Só há ${pecaSelecionada.qtd} ${pecaSelecionada.unidade} em estoque.`;
    }
    setErros(e);
    if (!semErros(e) || !pecaSelecionada) return;

    setSalvando(true);
    try {
      await onSalvar(dados, pecaSelecionada);
    } catch (err) {
      setErros({ quantidade: err instanceof Error ? err.message : 'Não foi possível dar baixa no estoque.' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="os-form">
      <div className="os-form-head">
        <h2>Adicionar peça</h2>
      </div>

      <div className="os-grid">
        <div className="os-campo os-col-2">
          <label>Peça *</label>
          <select
            value={dados.pecaId}
            onChange={(e) => set({ pecaId: e.target.value })}
            aria-invalid={!!erros.pecaId}
            autoFocus
          >
            <option value="">— selecione —</option>
            {pecas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} (estoque: {p.qtd} {p.unidade})
              </option>
            ))}
          </select>
          {erros.pecaId && <span className="os-erro">{erros.pecaId}</span>}
        </div>

        <div className="os-campo">
          <label>Quantidade *</label>
          <input
            inputMode="numeric"
            value={dados.quantidade}
            onChange={(e) => set({ quantidade: e.target.value })}
            aria-invalid={!!erros.quantidade}
          />
          {erros.quantidade && <span className="os-erro">{erros.quantidade}</span>}
        </div>

        {pecaSelecionada && (
          <div className="os-campo">
            <label>Preço unitário</label>
            <p className="os-valor-info">R$ {Number(pecaSelecionada.precoVenda).toFixed(2)}</p>
          </div>
        )}
      </div>

      <div className="os-acoes">
        {onCancelar && (
          <button type="button" className="os-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="os-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Adicionar peça'}
        </button>
      </div>
    </div>
  );
}

function FormServico({ onSalvar, onCancelar }: PropsServico) {
  const [dados, setDados] = useState<DadosItemServico>(dadosItemServicoVazio());
  const [erros, setErros] = useState<ErrosValidacao>({});
  const [salvando, setSalvando] = useState(false);

  function set(patch: Partial<DadosItemServico>) {
    setDados((d) => ({ ...d, ...patch }));
  }

  async function handleSalvar() {
    const e = validarItemServico(dados);
    setErros(e);
    if (!semErros(e)) return;
    setSalvando(true);
    try {
      await onSalvar(dados);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="os-form">
      <div className="os-form-head">
        <h2>Adicionar serviço</h2>
      </div>

      <div className="os-grid">
        <div className="os-campo os-col-2">
          <label>Descrição *</label>
          <input
            value={dados.descricao}
            onChange={(e) => set({ descricao: e.target.value })}
            placeholder="Ex.: troca de óleo e filtro"
            aria-invalid={!!erros.descricao}
            autoFocus
          />
          {erros.descricao && <span className="os-erro">{erros.descricao}</span>}
        </div>

        <div className="os-campo">
          <label>Quantidade *</label>
          <input
            inputMode="numeric"
            value={dados.quantidade}
            onChange={(e) => set({ quantidade: e.target.value })}
            aria-invalid={!!erros.quantidade}
          />
          {erros.quantidade && <span className="os-erro">{erros.quantidade}</span>}
        </div>

        <div className="os-campo">
          <label>Valor unitário (R$) *</label>
          <input
            inputMode="decimal"
            value={dados.valorUnit}
            onChange={(e) => set({ valorUnit: e.target.value })}
            placeholder="0,00"
            aria-invalid={!!erros.valorUnit}
          />
          {erros.valorUnit && <span className="os-erro">{erros.valorUnit}</span>}
        </div>
      </div>

      <div className="os-acoes">
        {onCancelar && (
          <button type="button" className="os-btn-sec" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="button" className="os-btn" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Adicionar serviço'}
        </button>
      </div>
    </div>
  );
}
