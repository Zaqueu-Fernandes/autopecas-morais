/**
 * ============================================================================
 * PÁGINA — CONFIGURAÇÕES (admin-only)
 * ============================================================================
 * Sub-aba de Admin (aba pai — ver AdministracaoPage.tsx). Hoje só guarda a
 * URL do serviço externo de consulta de NF-e por chave de acesso, usada pelo
 * botão "Baixar XML de Nota Fiscal" em Estoque — o admin configura porque
 * pode trocar de serviço quando quiser, sem depender de deploy novo.
 * Reaproveita a tabela genérica `configuracoes_sistema` (chave/valor), que
 * já nasce pronta pra guardar outras configurações futuras do sistema.
 */

import { useEffect, useState } from 'react';
import { Pencil, Link2 } from 'lucide-react';
import { CHAVE_URL_XML_NFE, buscarConfiguracao, salvarConfiguracao } from '@/features/configuracoes';

export function ConfiguracoesPage() {
  const [urlXml, setUrlXml] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [valorModal, setValorModal] = useState('');
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      setUrlXml(await buscarConfiguracao(CHAVE_URL_XML_NFE));
    } catch {
      setErro('Não foi possível carregar as configurações.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirModal() {
    setValorModal(urlXml ?? '');
    setErroModal(null);
    setMostrarModal(true);
  }

  async function handleSalvar() {
    const valor = valorModal.trim();
    if (!valor) {
      setErroModal('Informe a URL do serviço.');
      return;
    }
    setSalvando(true);
    setErroModal(null);
    try {
      await salvarConfiguracao(CHAVE_URL_XML_NFE, valor);
      setUrlXml(valor);
      setMostrarModal(false);
    } catch (erro) {
      setErroModal(erro instanceof Error ? erro.message : 'Não foi possível salvar a URL.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="pg">
      <div className="pg-head">
        <h1>Configurações</h1>
      </div>

      <p className="perm-intro">
        Ajustes gerais do sistema que o admin pode trocar sem precisar mexer no código.
      </p>

      {carregando && <p aria-live="polite">Carregando…</p>}
      {erro && <p className="perm-erro" aria-live="polite">{erro}</p>}

      {!carregando && !erro && (
        <div className="cfg-cartao">
          <div className="cfg-cartao-cabecalho">
            <Link2 size={16} />
            <h2>URL para baixar XML de Nota Fiscal</h2>
          </div>
          <p className="cfg-cartao-descricao">
            Link que o botão "Baixar XML de Nota Fiscal" (aba Estoque) abre numa aba nova — lá
            você cola a chave de acesso de 44 dígitos e baixa o XML manualmente no serviço
            escolhido. Troque aqui sempre que quiser usar outro serviço, sem precisar de deploy
            novo.
          </p>
          <p className="cfg-cartao-valor">
            {urlXml ? (
              <a href={urlXml} target="_blank" rel="noopener noreferrer">
                {urlXml}
              </a>
            ) : (
              <span className="cfg-vazio">Nenhuma URL configurada ainda.</span>
            )}
          </p>
          <button type="button" className="cfg-btn-sec" onClick={abrirModal}>
            <Pencil size={14} /> {urlXml ? 'Editar URL' : 'Configurar URL'}
          </button>
        </div>
      )}

      {mostrarModal && (
        <div className="confirm-overlay" onClick={() => !salvando && setMostrarModal(false)}>
          <div
            className="confirm-cartao confirm-info"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cfg-modal-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="cfg-modal-titulo">URL para baixar XML de Nota Fiscal</h2>
            <p>
              Cole o endereço do serviço/portal onde você consulta uma nota fiscal pela chave de
              acesso. O botão em Estoque vai abrir exatamente essa URL numa aba nova.
            </p>
            <div className="cfg-campo">
              <label htmlFor="cfg-url-xml">URL *</label>
              <input
                id="cfg-url-xml"
                type="url"
                value={valorModal}
                onChange={(e) => setValorModal(e.target.value)}
                placeholder="https://..."
                aria-invalid={!!erroModal}
                autoFocus
              />
              {erroModal && (
                <span className="cfg-erro" aria-live="polite">
                  {erroModal}
                </span>
              )}
            </div>
            <div className="confirm-acoes">
              <button
                type="button"
                className="confirm-btn-sec"
                onClick={() => setMostrarModal(false)}
                disabled={salvando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="confirm-btn confirm-btn-info"
                onClick={handleSalvar}
                disabled={salvando}
              >
                {salvando ? 'Salvando…' : 'Salvar URL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
