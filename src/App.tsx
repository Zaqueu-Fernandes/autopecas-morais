import { useState } from 'react';
import '@/features/cadastros/cadastros.css';
import '@/features/estoque/estoque.css';
import '@/features/ordens-servico/ordens-servico.css';
import '@/features/financeiro/financeiro.css';
import '@/features/vendas/vendas.css';
import '@/features/despesas/despesas.css';
import '@/features/empresa/empresa.css';
import '@/features/dashboard/dashboard.css';
import { ClientesPage } from '@/pages/ClientesPage';
import { FornecedoresPage } from '@/pages/FornecedoresPage';
import { EstoquePage } from '@/pages/EstoquePage';
import { OrdensServicoPage } from '@/pages/OrdensServicoPage';
import { FinanceiroPage } from '@/pages/FinanceiroPage';
import { VendasBalcaoPage } from '@/pages/VendasBalcaoPage';
import { DespesasFixasPage } from '@/pages/DespesasFixasPage';
import { DashboardPage } from '@/pages/DashboardPage';

const ABAS = [
  { id: 'dashboard', label: 'Dashboard', Componente: DashboardPage },
  { id: 'ordens-servico', label: 'Ordens de Serviço', Componente: OrdensServicoPage },
  { id: 'vendas', label: 'Vendas de Balcão', Componente: VendasBalcaoPage },
  { id: 'financeiro', label: 'Financeiro', Componente: FinanceiroPage },
  { id: 'despesas', label: 'Despesas Fixas', Componente: DespesasFixasPage },
  { id: 'clientes', label: 'Clientes', Componente: ClientesPage },
  { id: 'fornecedores', label: 'Fornecedores', Componente: FornecedoresPage },
  { id: 'estoque', label: 'Estoque', Componente: EstoquePage },
] as const;

type IdAba = (typeof ABAS)[number]['id'];

function App() {
  const [abaAtiva, setAbaAtiva] = useState<IdAba>('dashboard');
  const AbaAtual = ABAS.find((a) => a.id === abaAtiva)!.Componente;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-titulo">Autopeças Morais</h1>
        <nav className="app-nav">
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={a.id === abaAtiva ? 'app-nav-btn ativo' : 'app-nav-btn'}
              onClick={() => setAbaAtiva(a.id)}
            >
              {a.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-conteudo">
        <AbaAtual />
      </main>
    </div>
  );
}

export default App;
