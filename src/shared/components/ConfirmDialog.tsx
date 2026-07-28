/**
 * ============================================================================
 * MODAL DE CONFIRMAÇÃO / AVISO
 * ============================================================================
 * Renderizado pelo ConfirmacaoProvider (useConfirmacao.tsx) — não é usado
 * diretamente pelas telas, elas chamam confirmar()/avisar() e esse componente
 * aparece por cima de tudo quando há um pedido pendente.
 */

import { ShieldAlert, TriangleAlert, Info } from 'lucide-react';
import type { OpcoesAvisar, OpcoesConfirmar, TomConfirmacao } from '../hooks/useConfirmacao';

const ICONE_TOM: Record<TomConfirmacao, typeof ShieldAlert> = {
  perigo: ShieldAlert,
  aviso: TriangleAlert,
  info: Info,
};

interface Props {
  tipo: 'confirmar' | 'avisar';
  opcoes: OpcoesConfirmar | OpcoesAvisar;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ConfirmDialog({ tipo, opcoes, onConfirmar, onCancelar }: Props) {
  const tom: TomConfirmacao = opcoes.tom ?? (tipo === 'avisar' ? 'aviso' : 'perigo');
  const Icone = ICONE_TOM[tom];
  const linhas = Array.isArray(opcoes.mensagem) ? opcoes.mensagem : [opcoes.mensagem];
  const comTextoConfirmar = tipo === 'confirmar' ? (opcoes as OpcoesConfirmar) : null;

  return (
    <div className="confirm-overlay" onClick={tipo === 'avisar' ? onConfirmar : undefined}>
      <div
        className={`confirm-cartao confirm-${tom}`}
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icone">
          <Icone size={22} />
        </div>
        <h2>{opcoes.titulo}</h2>
        {linhas.map((linha, i) => (
          <p key={i}>{linha}</p>
        ))}
        <div className="confirm-acoes">
          {tipo === 'confirmar' && (
            <button type="button" className="confirm-btn-sec" onClick={onCancelar} autoFocus>
              {comTextoConfirmar?.textoCancelar ?? 'Cancelar'}
            </button>
          )}
          <button type="button" className={`confirm-btn confirm-btn-${tom}`} onClick={onConfirmar}>
            {tipo === 'avisar' ? 'Entendi' : (comTextoConfirmar?.textoConfirmar ?? 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}
