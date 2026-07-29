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
import { formatarMoeda } from '@/shared/utils/formatadores';

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
    if (!semErros(e) || !pecaSelecionada) {
      // Leva o foco pro primeiro campo inválido, na ordem em que aparecem no formulário.
      if (e.pecaId) document.getElementById('os-item-peca')?.focus();
      else if (e.quantidade) document.getElementById('os-item-peca-quantidade')?.focus();
      return;
    }

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
          <label htmlFor="os-item-peca">Peça *</label>
          <select
            id="os-item-peca"
            name="pecaId"
            autoComplete="off"
            value={dados.pecaId}
            onChange={(e) => set({ pecaId: e.target.value })}
            aria-invalid={!!erros.pecaId}
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
          <label htmlFor="os-item-peca-quantidade">Quantidade *</label>
          <input
            id="os-item-peca-quantidade"
            name="quantidade"
            autoComplete="off"
            inputMode="numeric"
            value={dados.quantidade}
            onChange={(e) => set({ quantidade: e.target.value })}
            aria-invalid={!!erros.quantidade}
          />
          {erros.quantidade && <span className="os-erro">{erros.quantidade}</span>}
        </div>

        {pecaSelecionada && (
          <div className="os-campo">
            <label id="os-item-peca-preco-label">Preço unitário</label>
            <p className="os-valor-info" aria-labelledby="os-item-peca-preco-label">
              {formatarMoeda(Number(pecaSelecionada.precoVenda))}
            </p>
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
    if (!semErros(e)) {
      if (e.descricao) document.getElementById('os-item-servico-descricao')?.focus();
      else if (e.quantidade) document.getElementById('os-item-servico-quantidade')?.focus();
      else if (e.valorUnit) document.getElementById('os-item-servico-valor')?.focus();
      return;
    }
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
          <label htmlFor="os-item-servico-descricao">Descrição *</label>
          <input
            id="os-item-servico-descricao"
            name="descricao"
            autoComplete="off"
            value={dados.descricao}
            onChange={(e) => set({ descricao: e.target.value })}
            placeholder="Ex.: troca de óleo e filtro"
            aria-invalid={!!erros.descricao}
          />
          {erros.descricao && <span className="os-erro">{erros.descricao}</span>}
        </div>

        <div className="os-campo">
          <label htmlFor="os-item-servico-quantidade">Quantidade *</label>
          <input
            id="os-item-servico-quantidade"
            name="quantidade"
            autoComplete="off"
            inputMode="numeric"
            value={dados.quantidade}
            onChange={(e) => set({ quantidade: e.target.value })}
            aria-invalid={!!erros.quantidade}
          />
          {erros.quantidade && <span className="os-erro">{erros.quantidade}</span>}
        </div>

        <div className="os-campo">
          <label htmlFor="os-item-servico-valor">Valor unitário (R$) *</label>
          <input
            id="os-item-servico-valor"
            name="valorUnit"
            autoComplete="off"
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
