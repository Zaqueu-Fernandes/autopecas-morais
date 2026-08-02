import { useState } from 'react';
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Wallet,
  ReceiptText,
  Package,
  ClipboardList,
  FolderCog,
  ShieldCheck,
  LogOut,
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
import '@/features/permissoes/permissoes.css';
import '@/features/pedido-fornecedor/pedido-fornecedor.css';
import '@/features/configuracoes/configuracoes.css';
import { CadastrosPage } from '@/pages/CadastrosPage';
import { EstoquePage } from '@/pages/EstoquePage';
import { OrdensServicoPage } from '@/pages/OrdensServicoPage';
import { FinanceiroPage } from '@/pages/FinanceiroPage';
import { VendasBalcaoPage } from '@/pages/VendasBalcaoPage';
import { DespesasFixasPage } from '@/pages/DespesasFixasPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdministracaoPage } from '@/pages/AdministracaoPage';
import { PedidoFornecedorPage } from '@/pages/PedidoFornecedorPage';
import { InstalarPwaBanner } from '@/shared/components/InstalarPwaBanner';
import { AlternarTema } from '@/shared/components/AlternarTema';
import { AlternarFormatoImpressao } from '@/features/impressao';
import { useAuth, LoginPage } from '@/features/auth';
import { Rodape } from '@/shared/components/Rodape';

const ABAS = [
  { id: 'dashboard', label: 'Dashboard', Icone: LayoutDashboard, Componente: DashboardPage },
  { id: 'ordens-servico', label: 'Ordens de Serviço', Icone: Wrench, Componente: OrdensServicoPage },
  { id: 'vendas', label: 'Vendas de Balcão', Icone: ShoppingCart, Componente: VendasBalcaoPage },
  { id: 'financeiro', label: 'Financeiro', Icone: Wallet, Componente: FinanceiroPage },
  { id: 'despesas', label: 'Despesas Recorrentes', Icone: ReceiptText, Componente: DespesasFixasPage },
  { id: 'estoque', label: 'Estoque', Icone: Package, Componente: EstoquePage },
  { id: 'pedido-fornecedor', label: 'Fazer Pedido', Icone: ClipboardList, Componente: PedidoFornecedorPage },
  { id: 'cadastros', label: 'Cadastros', Icone: FolderCog, Componente: CadastrosPage },
  { id: 'permissoes', label: 'Admin', Icone: ShieldCheck, Componente: AdministracaoPage, adminOnly: true },
] as const;

type IdAba = (typeof ABAS)[number]['id'];

function App() {
  const [abaAtiva, setAbaAtiva] = useState<IdAba>('dashboard');
  const { sessao, perfil, carregando, ehAdmin, sair } = useAuth();
  const abasVisiveis = ABAS.filter((a) => !('adminOnly' in a && a.adminOnly) || ehAdmin);
  const AbaAtual = (abasVisiveis.find((a) => a.id === abaAtiva) ?? abasVisiveis[0]).Componente;

  if (carregando) return null;
  if (!sessao) return <LoginPage />;

  return (
    <div className="app">
      <a href="#app-conteudo" className="app-skip-link">Pular para o conteúdo principal</a>
      <InstalarPwaBanner />
      <header className="app-header">
        <img
          src="/logo-transparente.png"
          alt="Autopeças Morais — Cuidando da vida do seu carro"
          className="app-logo"
          width={420}
          height={400}
        />
        <nav className="app-nav" aria-label="Navegação principal">
          {abasVisiveis.map((a) => {
            const Icone = a.Icone;
            return (
              <button
                key={a.id}
                type="button"
                className={a.id === abaAtiva ? 'app-nav-btn ativo' : 'app-nav-btn'}
                aria-current={a.id === abaAtiva ? 'page' : undefined}
                onClick={() => setAbaAtiva(a.id)}
              >
                <Icone size={16} aria-hidden="true" />
                {a.label}
              </button>
            );
          })}
        </nav>
        <span className="app-usuario">
          <span className="app-usuario-nome">{perfil?.nome ?? sessao.user.email}</span>
          {perfil && <span className="app-usuario-papel">{perfil.papel}</span>}
        </span>
        <AlternarFormatoImpressao />
        <AlternarTema />
        <button
          type="button"
          className="app-sair-btn"
          onClick={() => sair()}
          title="Sair"
          aria-label="Sair da conta"
        >
          <LogOut size={16} aria-hidden="true" />
        </button>
      </header>
      <main className="app-conteudo" id="app-conteudo">
        <AbaAtual />
      </main>
      <Rodape />
    </div>
  );
}

export default App;
