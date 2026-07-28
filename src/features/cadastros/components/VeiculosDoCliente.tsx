/**
 * ============================================================================
 * VEÍCULOS DE UM CLIENTE
 * ============================================================================
 * Lista os veículos do cliente com opção de adicionar, editar e excluir.
 * Usado dentro da linha expandida do cliente na tela de Clientes.
 */

import { useEffect, useState } from 'react';
import { CarFront, Pencil, Trash2 } from 'lucide-react';
import type { Veiculo } from '../types';
import {
  listarVeiculosPorCliente,
  salvarVeiculo,
  excluirVeiculo,
} from '../services/veiculos.service';
import { FormVeiculo } from './FormVeiculo';
import { useConfirmacao } from '@/shared/hooks/useConfirmacao';
import { ehViolacaoDeReferencia } from '@/shared/utils/erros';

interface Props {
  clienteId: string;
}

export function VeiculosDoCliente({ clienteId }: Props) {
  const { confirmar, avisar } = useConfirmacao();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [veiculoEmEdicao, setVeiculoEmEdicao] = useState<Veiculo | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setVeiculos(await listarVeiculosPorCliente(clienteId));
    } catch {
      setErro('Não foi possível carregar os veículos.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  async function handleSalvar(v: Veiculo) {
    await salvarVeiculo({ ...v, clienteId });
    setMostrarForm(false);
    setVeiculoEmEdicao(null);
    await carregar();
  }

  async function handleExcluir(v: Veiculo) {
    const ok = await confirmar({
      titulo: 'Excluir este veículo?',
      tom: 'perigo',
      mensagem: `"${v.placa}"${v.marca || v.modelo ? ` (${v.marca} ${v.modelo})`.trim() : ''} vai ser apagado definitivamente. Só funciona se ele nunca tiver sido usado em nenhuma Ordem de Serviço — se já foi, o banco recusa pra não perder o histórico.`,
      textoConfirmar: 'Sim, excluir definitivamente',
    });
    if (!ok) return;
    try {
      await excluirVeiculo(v.id!);
      await carregar();
    } catch (erro) {
      if (ehViolacaoDeReferencia(erro)) {
        await avisar({
          titulo: 'Não é possível excluir',
          mensagem: `"${v.placa}" já está vinculado a uma ou mais Ordens de Serviço — excluir apagaria esse histórico. Mantenha o cadastro dele mesmo que o veículo não seja mais atendido.`,
        });
        return;
      }
      throw erro;
    }
  }

  if (mostrarForm) {
    return (
      <FormVeiculo
        clienteId={clienteId}
        inicial={veiculoEmEdicao ?? undefined}
        onSalvar={handleSalvar}
        onCancelar={() => {
          setMostrarForm(false);
          setVeiculoEmEdicao(null);
        }}
      />
    );
  }

  return (
    <div className="cad-veiculos">
      <div className="cad-veiculos-head">
        <strong>Veículos</strong>
        <button
          type="button"
          className="cad-btn"
          onClick={() => {
            setVeiculoEmEdicao(null);
            setMostrarForm(true);
          }}
        >
          <CarFront size={16} /> Novo veículo
        </button>
      </div>

      {carregando && <p>Carregando…</p>}
      {erro && <p className="cad-erro">{erro}</p>}

      {!carregando && !erro && veiculos.length === 0 && (
        <p className="cad-veiculos-vazio">Nenhum veículo cadastrado.</p>
      )}

      {!carregando && veiculos.length > 0 && (
        <ul className="cad-veiculos-lista">
          {veiculos.map((v) => (
            <li key={v.id}>
              <span>
                <strong>{v.placa}</strong>
                {(v.marca || v.modelo) && ` — ${v.marca} ${v.modelo}`.trim()}
                {v.ano && ` (${v.ano})`}
              </span>
              <span className="cad-veiculos-acoes">
                <button
                  type="button"
                  onClick={() => {
                    setVeiculoEmEdicao(v);
                    setMostrarForm(true);
                  }}
                >
                  <Pencil size={13} /> Editar
                </button>
                <button type="button" onClick={() => handleExcluir(v)}>
                  <Trash2 size={13} /> Excluir
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
