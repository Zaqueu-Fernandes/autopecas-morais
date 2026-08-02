/**
 * ============================================================================
 * PÁGINA — ADMIN (aba pai, admin-only)
 * ============================================================================
 * Agrupa as telas admin-only numa sub-navegação interna — mesmo padrão de
 * CadastrosPage. Hoje reúne Permissões (por operador), Ocultar Pagamentos em
 * Dinheiro (em lote, por período/usuário) e Configurações (ajustes gerais do
 * sistema, ex.: URL para baixar XML de nota fiscal).
 */

import { useState } from 'react';
import { ShieldCheck, EyeOff, Settings } from 'lucide-react';
import { PermissoesPage } from './PermissoesPage';
import { OcultarDinheiroPage } from './OcultarDinheiroPage';
import { ConfiguracoesPage } from './ConfiguracoesPage';

const SUBABAS = [
  { id: 'permissoes', label: 'Permissões', Icone: ShieldCheck, Componente: PermissoesPage },
  { id: 'ocultar-dinheiro', label: 'Ocultar Pagamentos em Dinheiro', Icone: EyeOff, Componente: OcultarDinheiroPage },
  { id: 'configuracoes', label: 'URL para baixar XML', Icone: Settings, Componente: ConfiguracoesPage },
] as const;

type IdSubaba = (typeof SUBABAS)[number]['id'];

export function AdministracaoPage() {
  const [subAbaAtiva, setSubAbaAtiva] = useState<IdSubaba>('permissoes');
  const SubAbaAtual = SUBABAS.find((a) => a.id === subAbaAtiva)!.Componente;

  return (
    <div>
      <nav className="pg-subnav">
        {SUBABAS.map((a) => {
          const Icone = a.Icone;
          return (
            <button
              key={a.id}
              type="button"
              className={a.id === subAbaAtiva ? 'pg-subnav-btn ativo' : 'pg-subnav-btn'}
              aria-current={a.id === subAbaAtiva ? 'page' : undefined}
              onClick={() => setSubAbaAtiva(a.id)}
            >
              <Icone size={14} />
              {a.label}
            </button>
          );
        })}
      </nav>
      <SubAbaAtual />
    </div>
  );
}
