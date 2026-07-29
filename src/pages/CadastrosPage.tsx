/**
 * ============================================================================
 * PÁGINA — CADASTROS (aba pai)
 * ============================================================================
 * Agrupa as telas de cadastro/administração que antes eram abas separadas
 * (Empresas, Clientes, Fornecedores) + a nova Categorias, numa sub-navegação
 * interna — reduz o número de abas no menu principal do app.
 */

import { useState } from 'react';
import { Building2, Users, Truck, Tags } from 'lucide-react';
import { EmpresasPage } from './EmpresasPage';
import { ClientesPage } from './ClientesPage';
import { FornecedoresPage } from './FornecedoresPage';
import { CategoriasPage } from './CategoriasPage';

const SUBABAS = [
  { id: 'empresas', label: 'Empresas', Icone: Building2, Componente: EmpresasPage },
  { id: 'clientes', label: 'Clientes', Icone: Users, Componente: ClientesPage },
  { id: 'fornecedores', label: 'Fornecedores', Icone: Truck, Componente: FornecedoresPage },
  { id: 'categorias', label: 'Categorias', Icone: Tags, Componente: CategoriasPage },
] as const;

type IdSubaba = (typeof SUBABAS)[number]['id'];

export function CadastrosPage() {
  const [subAbaAtiva, setSubAbaAtiva] = useState<IdSubaba>('empresas');
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
