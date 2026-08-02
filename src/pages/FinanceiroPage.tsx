/**
 * ============================================================================
 * PÁGINA — FINANCEIRO (aba pai)
 * ============================================================================
 * Agrupa as 4 sub-telas de dinheiro numa sub-navegação interna (mesmo padrão
 * de CadastrosPage/AdministracaoPage): Contas a Pagar e Contas a Receber
 * concentram as AÇÕES (quitar, editar valor, excluir, estornar — Contas a
 * Pagar também lança conta nova); Extrato é só CONSULTA (despesas e
 * receitas juntas, sem nenhum botão de ação); Fluxo de Caixa (dinheiro que
 * já entrou/saiu de fato) entra debaixo do mesmo guarda-chuva. Separar
 * consulta de ação foi pedido explícito do usuário, pra não confundir "ver
 * o extrato" com "mexer num lançamento".
 */

import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, ScrollText, ArrowLeftRight } from 'lucide-react';
import { ContasPagarPage } from './ContasPagarPage';
import { ContasReceberPage } from './ContasReceberPage';
import { ExtratoFinanceiroPage } from './ExtratoFinanceiroPage';
import { FluxoCaixaPage } from './FluxoCaixaPage';

const SUBABAS = [
  { id: 'pagar', label: 'Contas a Pagar', Icone: ArrowUpCircle, Componente: ContasPagarPage },
  { id: 'receber', label: 'Contas a Receber', Icone: ArrowDownCircle, Componente: ContasReceberPage },
  { id: 'extrato', label: 'Extrato', Icone: ScrollText, Componente: ExtratoFinanceiroPage },
  { id: 'fluxo-caixa', label: 'Fluxo de Caixa', Icone: ArrowLeftRight, Componente: FluxoCaixaPage },
] as const;

type IdSubaba = (typeof SUBABAS)[number]['id'];

export function FinanceiroPage() {
  const [subAbaAtiva, setSubAbaAtiva] = useState<IdSubaba>('pagar');
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
