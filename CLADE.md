\# Sistema de Gestão para Oficina Mecânica + Loja de Peças



\## Sobre o projeto

PWA de gestão para oficina mecânica com loja de peças. Faz controle de

ordens de serviço, estoque, vendas de balcão, financeiro e cadastros.

Usuário único inicialmente (dono da oficina), rodando em Windows e Android.



\## Stack

\- React + TypeScript + Vite

\- Supabase (Postgres + Auth + Storage)

\- PWA (instalável, funciona offline nos cadastros/consultas)

\- SEM bibliotecas de UI pesadas — CSS próprio, componentes simples



\## Regras de código (IMPORTANTES)

\- SEMPRE que alterar um arquivo de código, forneça o código completo e

&#x20; atualizado do arquivo — nunca trechos isolados ou diffs parciais.

\- Organize por FEATURE (domínio), não por tipo de arquivo. Cada feature em

&#x20; src/features/<nome>/ é autocontida (components + services + types).

\- Todo acesso ao banco fica em arquivos \*.service.ts dentro do feature.

&#x20; Componentes NÃO chamam o Supabase direto.

\- Em React, NÃO use tag <form>; use onClick nos botões.

\- Comente o código em português, de forma didática.

\- Nomes de variáveis, tabelas e colunas em português.



\## Arquitetura de negócio (decisões já tomadas)



\### Regime tributário (MEI ↔ ME)

\- A empresa começa como MEI e pode migrar para ME (Simples).

\- Existe um campo `regime` em empresa\_config ('MEI' | 'ME\_SIMSPLES') que

&#x20; funciona como interruptor. A migração é só editar esse campo.

\- Regras fiscais ficam CENTRALIZADAS num helper único, nunca espalhadas.

\- Já capturar no MEI os dados que o ME vai precisar (endereço completo,

&#x20; tipo PF/PJ do cliente, separação peça x serviço).



\### Estoque

\- O saldo real vem SEMPRE do razão (movimentacao\_estoque). pecas.qtd é só

&#x20; cache. Nunca editar pecas.qtd na mão — sempre via movimento.

\- Baixa de peça acontece no momento do USO (na OS ou venda), não no pagamento.

\- Custo: modelo SIMPLES — último custo sobrescreve pecas.preco\_custo. Mas

&#x20; gravar o custo histórico em movimentacao\_estoque.custo\_unit sempre.



\### Ordem de Serviço

\- Fluxo: Aberta → Em andamento → Concluída → Faturada.

\- Faturamento é SEPARADO da execução. Ao faturar, gera registro(s) em

&#x20; financeiro. Três situações de recebimento:

&#x20; 1. À vista: pago=true, forma preenchida, data\_pagamento=hoje

&#x20; 2. A prazo: pago=false, vencimento=data

&#x20; 3. Em aberto (fiado): pago=false, vencimento=NULL, amarrado ao cliente

\- OS faturada trava para edição (correção só via estorno).



\### Financeiro

\- Toda saída é financeiro tipo='pagar' com uma `categoria`:

&#x20; fornecedor | despesa\_fixa | despesa\_variavel | imposto | folha |

&#x20; retirada\_lucro

\- REGRA DE OURO: retirada\_lucro NUNCA entra no cálculo de lucro (é o

&#x20; destino do lucro, não um custo).

\- Despesas fixas recorrentes ficam em despesas\_fixas e geram contas do mês.



\### Impressão (feature já pronta em src/features/impressao)

\- Camada única PrinterService. Telas chamam printer.imprimir(doc).

\- Fase 1 (atual): método 'browser' (HTML/CSS 80mm). Implementado.

\- Fase 2 (futuro): ESC/POS via Web Bluetooth/USB. Interface pronta, stubs

&#x20; documentados. Ambiente suporta (Windows/Android Chrome).

\- Fase 3 (ao virar ME): NFC-e/NFS-e via API de terceiros. O DANFE vem

&#x20; pronto do emissor e entra na mesma camada (campo doc.fiscal).



\### Cadastros (feature já pronta em src/features/cadastros)

\- Cliente e fornecedor com endereço completo separado em campos.

\- Busca automática por CEP via ViaCEP.

\- Obrigatoriedade: nome+telefone sempre; endereço completo só quando PJ ou

&#x20; quando exigirNota=true.



\## Documentos fiscais — cuidado

NÃO implementar emissão fiscal própria falando direto com SEFAZ/prefeitura.

Quando chegar a hora (ME), usar API de terceiros (PlugNotas, Focus, eNotas).

Até lá, o sistema gera COMPROVANTE INTERNO ("sem valor fiscal").



\## Ordem de construção sugerida (MVP → completo)

1\. Cadastros (clientes, veículos, fornecedores) + Estoque base

2\. Ordens de Serviço com baixa de estoque

3\. Faturamento + Financeiro (3 situações de recebimento)

4\. Vendas de balcão

5\. Despesas e categorias financeiras

6\. Dashboard + monitor de faturamento MEI

7\. Fases futuras: importação XML NF-e, impressão ESC/POS, emissão fiscal

