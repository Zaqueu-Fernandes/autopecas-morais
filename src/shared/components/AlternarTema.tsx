/**
 * ============================================================================
 * BOTÃO — ALTERNAR TEMA CLARO/ESCURO
 * ============================================================================
 */

import { Sun, Moon } from 'lucide-react';
import { useTema } from '../hooks/useTema';

export function AlternarTema() {
  const { tema, alternar } = useTema();

  return (
    <button
      type="button"
      className="app-tema-btn"
      onClick={alternar}
      aria-label={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      title={tema === 'dark' ? 'Tema claro' : 'Tema escuro'}
    >
      {tema === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
