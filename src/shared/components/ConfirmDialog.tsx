/**
 * ============================================================================
 * MODAL DE CONFIRMAÇÃO / AVISO
 * ============================================================================
 * Renderizado pelo ConfirmacaoProvider (useConfirmacao.tsx) — não é usado
 * diretamente pelas telas, elas chamam confirmar()/avisar() e esse componente
 * aparece por cima de tudo quando há um pedido pendente.
 */

import { useEffect, useRef } from 'react';
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
  const cartaoRef = useRef<HTMLDivElement>(null);

  // Esc fecha o diálogo (cancela se for confirmação, "aceita" se for só aviso)
  // e o Tab fica preso dentro do cartão enquanto ele está aberto.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        tipo === 'confirmar' ? onCancelar() : onConfirmar();
        return;
      }
      if (e.key !== 'Tab' || !cartaoRef.current) return;
      const focaveis = cartaoRef.current.querySelectorAll<HTMLElement>('button');
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [tipo, onConfirmar, onCancelar]);

  return (
    <div className="confirm-overlay" onClick={tipo === 'avisar' ? onConfirmar : undefined}>
      <div
        ref={cartaoRef}
        className={`confirm-cartao confirm-${tom}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        aria-describedby="confirm-mensagem"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-icone">
          <Icone size={22} aria-hidden="true" />
        </div>
        <h2 id="confirm-titulo">{opcoes.titulo}</h2>
        <div id="confirm-mensagem">
          {linhas.map((linha, i) => (
            <p key={i}>{linha}</p>
          ))}
        </div>
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
