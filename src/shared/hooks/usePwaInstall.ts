/**
 * ============================================================================
 * usePwaInstall — captura o prompt de instalação do PWA
 * ============================================================================
 * Chrome/Edge (desktop e Android) disparam `beforeinstallprompt`; guardamos
 * esse evento e chamamos `.prompt()` quando o usuário clica no nosso botão
 * (o navegador não deixa mostrar o prompt nativo sozinho, sem gesto do
 * usuário — não tem como "forçar" de verdade, só deixar bem visível).
 *
 * iOS Safari NUNCA dispara esse evento (Apple não implementa a API) — lá a
 * instalação é manual via Compartilhar → Adicionar à Tela de Início, então
 * `instalavel` fica sempre false e quem usa este hook precisa tratar iOS à
 * parte (ver InstalarPwaBanner).
 */

import { useEffect, useState } from 'react';

interface EventoBeforeInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function estaRodandoInstalado(): boolean {
  const modoStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
  return modoStandalone || iosStandalone;
}

export function detectarPlataforma(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

export function usePwaInstall() {
  const [promptGuardado, setPromptGuardado] = useState<EventoBeforeInstallPrompt | null>(null);
  const [instalavel, setInstalavel] = useState(false);
  const [instalado, setInstalado] = useState(estaRodandoInstalado());

  useEffect(() => {
    function aoFicarInstalavel(e: Event) {
      e.preventDefault();
      setPromptGuardado(e as EventoBeforeInstallPrompt);
      setInstalavel(true);
    }
    function aoInstalar() {
      setInstalado(true);
      setInstalavel(false);
      setPromptGuardado(null);
    }

    window.addEventListener('beforeinstallprompt', aoFicarInstalavel);
    window.addEventListener('appinstalled', aoInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', aoFicarInstalavel);
      window.removeEventListener('appinstalled', aoInstalar);
    };
  }, []);

  async function instalar(): Promise<'accepted' | 'dismissed' | null> {
    if (!promptGuardado) return null;
    await promptGuardado.prompt();
    const escolha = await promptGuardado.userChoice;
    setPromptGuardado(null);
    setInstalavel(false);
    return escolha.outcome;
  }

  return { instalavel, instalado, instalar };
}
