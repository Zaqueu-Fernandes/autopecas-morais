import { useState } from 'react';
import '@/features/cadastros/cadastros.css';
import '@/features/estoque/estoque.css';
import { ClientesPage } from '@/pages/ClientesPage';
import { FornecedoresPage } from '@/pages/FornecedoresPage';
import { EstoquePage } from '@/pages/EstoquePage';

const ABAS = [
  { id: 'clientes', label: 'Clientes', Componente: ClientesPage },
  { id: 'fornecedores', label: 'Fornecedores', Componente: FornecedoresPage },
  { id: 'estoque', label: 'Estoque', Componente: EstoquePage },
] as const;

type IdAba = (typeof ABAS)[number]['id'];

function App() {
  const [abaAtiva, setAbaAtiva] = useState<IdAba>('clientes');
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
