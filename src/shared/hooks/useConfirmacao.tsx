/**
 * ============================================================================
 * CONTEXTO — CONFIRMAÇÃO / AVISO (substitui window.confirm/window.alert)
 * ============================================================================
 * Envolve o app inteiro (main.tsx, dentro do AuthProvider). Qualquer tela
 * chama `const { confirmar, avisar } = useConfirmacao()`:
 *   - confirmar({ titulo, mensagem, tom?, textoConfirmar?, textoCancelar? })
 *     → Promise<boolean> (true = usuário confirmou)
 *   - avisar({ titulo, mensagem, tom? })
 *     → Promise<void> (resolve quando o usuário clica "Entendi")
 * Só um diálogo por vez — chamadas encadeadas empilham naturalmente porque
 * quem chama usa `await`.
 */

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';

export type TomConfirmacao = 'perigo' | 'aviso' | 'info';

export interface OpcoesConfirmar {
  titulo: string;
  /** Uma frase, ou várias (cada uma vira um parágrafo) — use várias pra explicar o impacto em passos. */
  mensagem: string | string[];
  tom?: TomConfirmacao;
  textoConfirmar?: string;
  textoCancelar?: string;
}

export interface OpcoesAvisar {
  titulo: string;
  mensagem: string | string[];
  tom?: TomConfirmacao;
}

interface EstadoDialogo {
  tipo: 'confirmar' | 'avisar';
  opcoes: OpcoesConfirmar | OpcoesAvisar;
  resolver: (valor: boolean) => void;
}

interface ConfirmacaoContextValor {
  confirmar: (opcoes: OpcoesConfirmar) => Promise<boolean>;
  avisar: (opcoes: OpcoesAvisar) => Promise<void>;
}

const ConfirmacaoContext = createContext<ConfirmacaoContextValor | null>(null);

export function ConfirmacaoProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoDialogo | null>(null);

  const confirmar = useCallback((opcoes: OpcoesConfirmar) => {
    return new Promise<boolean>((resolver) => {
      setEstado({ tipo: 'confirmar', opcoes, resolver });
    });
  }, []);

  const avisar = useCallback((opcoes: OpcoesAvisar) => {
    return new Promise<void>((resolver) => {
      setEstado({ tipo: 'avisar', opcoes, resolver: () => resolver() });
    });
  }, []);

  function fechar(valor: boolean) {
    estado?.resolver(valor);
    setEstado(null);
  }

  return (
    <ConfirmacaoContext.Provider value={{ confirmar, avisar }}>
      {children}
      {estado && (
        <ConfirmDialog
          tipo={estado.tipo}
          opcoes={estado.opcoes}
          onConfirmar={() => fechar(true)}
          onCancelar={() => fechar(false)}
        />
      )}
    </ConfirmacaoContext.Provider>
  );
}

export function useConfirmacao(): ConfirmacaoContextValor {
  const ctx = useContext(ConfirmacaoContext);
  if (!ctx) throw new Error('useConfirmacao precisa estar dentro de <ConfirmacaoProvider>.');
  return ctx;
}
