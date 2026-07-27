/**
 * ============================================================================
 * useTema — alterna claro/escuro e persiste a escolha
 * ============================================================================
 * Guarda a preferência em localStorage; sem preferência salva, segue o
 * sistema (prefers-color-scheme). Aplica via atributo data-theme na <html>,
 * que as variáveis CSS em App.css usam pra trocar as cores. Um script inline
 * no index.html já aplica isso antes do primeiro paint, pra não piscar.
 */

import { useEffect, useState } from 'react';

export type Tema = 'light' | 'dark';

const CHAVE = 'tema';

function lerTemaSalvo(): Tema | null {
  const salvo = localStorage.getItem(CHAVE);
  return salvo === 'light' || salvo === 'dark' ? salvo : null;
}

function temaDoSistema(): Tema {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(() => lerTemaSalvo() ?? temaDoSistema());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
  }, [tema]);

  function alternar() {
    setTema((atual) => {
      const novo: Tema = atual === 'dark' ? 'light' : 'dark';
      localStorage.setItem(CHAVE, novo);
      return novo;
    });
  }

  return { tema, alternar };
}
