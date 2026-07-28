import { useState } from 'react';
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Wallet,
  ArrowLeftRight,
  ReceiptText,
  Package,
  FolderCog,
} from 'lucide-react';
import '@/features/cadastros/cadastros.css';
import '@/features/estoque/estoque.css';
import '@/features/ordens-servico/ordens-servico.css';
import '@/features/financeiro/financeiro.css';
import '@/features/vendas/vendas.css';
import '@/features/despesas/despesas.css';
import '@/features/empresa/empresa.css';
import '@/features/dashboard/dashboard.css';
import '@/features/importacao-nfe/importacao-nfe.css';
import { CadastrosPage } from '@/pages/CadastrosPage';
import { EstoquePage } from '@/pages/EstoquePage';
import { OrdensServicoPage } from '@/pages/OrdensServicoPage';
import { FinanceiroPage } from '@/pages/FinanceiroPage';
import { FluxoCaixaPage } from '@/pages/FluxoCaixaPage';
import { VendasBalcaoPage } from '@/pages/VendasBalcaoPage';
import { DespesasFixasPage } from '@/pages/DespesasFixasPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { InstalarPwaBanner } from '@/shared/components/InstalarPwaBanner';
import { AlternarTema } from '@/shared/components/AlternarTema';
import { AlternarFormatoImpressao } from '@/features/impressao';

const ABAS = [
  { id: 'dashboard', label: 'Dashboard', Icone: LayoutDashboard, Componente: DashboardPage },
  { id: 'ordens-servico', label: 'Ordens de Serviço', Icone: Wrench, Componente: OrdensServicoPage },
  { id: 'vendas', label: 'Vendas de Balcão', Icone: ShoppingCart, Componente: VendasBalcaoPage },
  { id: 'financeiro', label: 'Financeiro', Icone: Wallet, Componente: FinanceiroPage },
  { id: 'fluxo-caixa', label: 'Fluxo de Caixa', Icone: ArrowLeftRight, Componente: FluxoCaixaPage },
  { id: 'despesas', label: 'Despesas Recorrentes', Icone: ReceiptText, Componente: DespesasFixasPage },
  { id: 'estoque', label: 'Estoque', Icone: Package, Componente: EstoquePage },
  { id: 'cadastros', label: 'Cadastros', Icone: FolderCog, Componente: CadastrosPage },
] as const;

type IdAba = (typeof ABAS)[number]['id'];

function App() {
  const [abaAtiva, setAbaAtiva] = useState<IdAba>('dashboard');
  const AbaAtual = ABAS.find((a) => a.id === abaAtiva)!.Componente;

  return (
    <div className="app">
      <InstalarPwaBanner />
      <header className="app-header">
        <img
          src="/icones/IconPage.png"
          alt="Autopeças Morais — Cuidando da vida do seu carro"
          className="app-logo"
        />
        <nav className="app-nav">
          {ABAS.map((a) => {
            const Icone = a.Icone;
            return (
              <button
                key={a.id}
                type="button"
                className={a.id === abaAtiva ? 'app-nav-btn ativo' : 'app-nav-btn'}
                onClick={() => setAbaAtiva(a.id)}
              >
                <Icone size={16} />
                {a.label}
              </button>
            );
          })}
        </nav>
        <AlternarFormatoImpressao />
        <AlternarTema />
      </header>
      <main className="app-conteudo">
        <AbaAtual />
      </main>
    </div>
  );
}

export default App;
