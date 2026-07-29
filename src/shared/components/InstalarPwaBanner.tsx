/**
 * ============================================================================
 * BANNER — INSTALAR O PWA
 * ============================================================================
 * Aparece assim que o app abre pelo link, em qualquer plataforma, até o
 * usuário instalar ou fechar (fechar "soneca" por alguns dias, não pra
 * sempre). Navegador nenhum deixa instalar sem gesto do usuário — isso aqui
 * é o mais perto de "forçar" que dá: bem visível, sempre no topo.
 *
 * Desktop/Android (Chrome/Edge): botão "Instalar" aciona o prompt nativo.
 * iOS Safari: não existe prompt nativo — mostra o passo a passo manual
 * (Compartilhar → Adicionar à Tela de Início).
 */

import { useState } from 'react';
import { Download, X, Share } from 'lucide-react';
import { usePwaInstall, detectarPlataforma, estaRodandoInstalado } from '../hooks/usePwaInstall';

const CHAVE_DISPENSADO = 'pwa-banner-dispensado-em';
const DIAS_PARA_REAPARECER = 7;

function foiDispensadoRecentemente(): boolean {
  const bruto = localStorage.getItem(CHAVE_DISPENSADO);
  if (!bruto) return false;
  const diasPassados = (Date.now() - new Date(bruto).getTime()) / (1000 * 60 * 60 * 24);
  return diasPassados < DIAS_PARA_REAPARECER;
}

export function InstalarPwaBanner() {
  const { instalavel, instalado, instalar } = usePwaInstall();
  const [dispensado, setDispensado] = useState(foiDispensadoRecentemente());
  const [mostrarInstrucoesIos, setMostrarInstrucoesIos] = useState(false);
  const plataforma = detectarPlataforma();

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSADO, new Date().toISOString());
    setDispensado(true);
  }

  async function handleInstalar() {
    const resultado = await instalar();
    if (resultado === 'dismissed') dispensar();
  }

  if (instalado || estaRodandoInstalado() || dispensado) return null;
  if (plataforma !== 'ios' && !instalavel) return null;

  return (
    <div className="pwa-banner">
      <div className="pwa-banner-linha">
        <div className="pwa-banner-conteudo">
          <Download size={20} aria-hidden="true" />
          <div className="pwa-banner-texto">
            <strong>Instale o Autopeças Morais</strong>
            <span>Acesso rápido direto da tela inicial — funciona até offline nos cadastros.</span>
          </div>
        </div>

        <div className="pwa-banner-acoes">
          {plataforma === 'ios' ? (
            <button
              type="button"
              className="pwa-banner-btn"
              onClick={() => setMostrarInstrucoesIos((v) => !v)}
              aria-expanded={mostrarInstrucoesIos}
              aria-controls="pwa-instrucoes-ios"
            >
              Como instalar
            </button>
          ) : (
            <button type="button" className="pwa-banner-btn" onClick={handleInstalar}>
              Instalar
            </button>
          )}
          <button type="button" className="pwa-banner-fechar" onClick={dispensar} aria-label="Fechar">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {mostrarInstrucoesIos && (
        <div className="pwa-banner-instrucoes" id="pwa-instrucoes-ios">
          <Share size={14} aria-hidden="true" />
          Toque em <strong>Compartilhar</strong> na barra do Safari e depois em{' '}
          <strong>“Adicionar à Tela de Início”</strong>.
        </div>
      )}
    </div>
  );
}
