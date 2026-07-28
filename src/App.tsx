import { useState } from 'react';
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Wallet,
  ArrowLeftRight,
  ReceiptText,
  Users,
  Truck,
  Package,
  Building2,
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
import { ClientesPage } from '@/pages/ClientesPage';
import { FornecedoresPage } from '@/pages/FornecedoresPage';
import { EstoquePage } from '@/pages/EstoquePage';
import { OrdensServicoPage } from '@/pages/OrdensServicoPage';
import { FinanceiroPage } from '@/pages/FinanceiroPage';
import { FluxoCaixaPage } from '@/pages/FluxoCaixaPage';
import { VendasBalcaoPage } from '@/pages/VendasBalcaoPage';
import { DespesasFixasPage } from '@/pages/DespesasFixasPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { EmpresasPage } from '@/pages/EmpresasPage';
import { InstalarPwaBanner } from '@/shared/components/InstalarPwaBanner';
import { AlternarTema } from '@/shared/components/AlternarTema';

const ABAS = [
  { id: 'dashboard', label: 'Dashboard', Icone: LayoutDashboard, Componente: DashboardPage },
  { id: 'ordens-servico', label: 'Ordens de Serviço', Icone: Wrench, Componente: OrdensServicoPage },
  { id: 'vendas', label: 'Vendas de Balcão', Icone: ShoppingCart, Componente: VendasBalcaoPage },
  { id: 'financeiro', label: 'Financeiro', Icone: Wallet, Componente: FinanceiroPage },
  { id: 'fluxo-caixa', label: 'Fluxo de Caixa', Icone: ArrowLeftRight, Componente: FluxoCaixaPage },
  { id: 'despesas', label: 'Despesas Recorrentes', Icone: ReceiptText, Componente: DespesasFixasPage },
  { id: 'empresas', label: 'Empresas', Icone: Building2, Componente: EmpresasPage },
  { id: 'clientes', label: 'Clientes', Icone: Users, Componente: ClientesPage },
  { id: 'fornecedores', label: 'Fornecedores', Icone: Truck, Componente: FornecedoresPage },
  { id: 'estoque', label: 'Estoque', Icone: Package, Componente: EstoquePage },
] as const;

type IdAba = (typeof ABAS)[number]['id'];

function App() {
  const [abaAtiva, setAbaAtiva] = useState<IdAba>('dashboard');
  const AbaAtual = ABAS.find((a) => a.id === abaAtiva)!.Componente;

  return (
    <div className="app">
      <InstalarPwaBanner />
      <header className="app-header">
        <div className="app-titulo-bloco">
          <h1 className="app-titulo">Autopeças Morais</h1>
          <p className="app-tagline">Cuidando da vida do seu carro</p>
        </div>
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
        <AlternarTema />
      </header>
      <main className="app-conteudo">
        <AbaAtual />
      </main>
    </div>
  );
}

export default App;
