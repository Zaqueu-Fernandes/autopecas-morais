/**
 * ============================================================================
 * useFormatoImpressao — preferência global de papel (térmica x A4/Carta)
 * ============================================================================
 * Mesma ideia do useTema (shared): guarda em localStorage, um toggle no
 * cabeçalho troca pra todo mundo de uma vez. Existe pra não ter que
 * perguntar "térmica ou A4?" toda vez que alguém clica em Imprimir — a
 * oficina normalmente usa sempre o mesmo tipo de impressora.
 * lerFormatoImpressao() é a versão "fora de componente React", usada pelo
 * printer.service.ts (que não é um hook) na hora de montar o HTML certo.
 */

import { useEffect, useState } from 'react';

export type FormatoImpressao = 'termica' | 'a4';

const CHAVE = 'formato_impressao';

export function lerFormatoImpressao(): FormatoImpressao {
  const salvo = localStorage.getItem(CHAVE);
  return salvo === 'a4' ? 'a4' : 'termica';
}

export function useFormatoImpressao() {
  const [formato, setFormato] = useState<FormatoImpressao>(() => lerFormatoImpressao());

  useEffect(() => {
    localStorage.setItem(CHAVE, formato);
  }, [formato]);

  function alternar() {
    setFormato((atual) => (atual === 'termica' ? 'a4' : 'termica'));
  }

  return { formato, alternar };
}
