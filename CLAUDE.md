# Sistema de Gestão para Oficina Mecânica + Loja de Peças

## Sobre o projeto

PWA de gestão para oficina mecânica com loja de peças. Faz controle de
ordens de serviço, estoque, vendas de balcão, financeiro e cadastros.
Usuário único inicialmente (dono da oficina), rodando em Windows e Android.

## Stack

- React + TypeScript + Vite
- Supabase (Postgres + Auth + Storage)
- PWA (instalável, funciona offline nos cadastros/consultas)
- SEM bibliotecas de UI pesadas — CSS próprio, componentes simples

## Regras de código (IMPORTANTES)

- SEMPRE que alterar um arquivo de código, forneça o código completo e
  atualizado do arquivo — nunca trechos isolados ou diffs parciais.
- Organize por FEATURE (domínio), não por tipo de arquivo. Cada feature em
  src/features/<nome>/ é autocontida (components + services + types).
- Todo acesso ao banco fica em arquivos *.service.ts dentro do feature.
  Componentes NÃO chamam o Supabase direto.
- Em React, NÃO use tag <form>; use onClick nos botões.
- Comente o código em português, de forma didática.
- Nomes de variáveis, tabelas e colunas em português.

## Arquitetura de negócio (decisões já tomadas)

### Regime tributário (MEI ↔ ME)

- A empresa começa como MEI e pode migrar para ME (Simples).
- Existe um campo `regime` em empresa_config ('MEI' | 'ME_SIMPLES') que
  funciona como interruptor. A migração é só editar esse campo.
- Regras fiscais ficam CENTRALIZADAS num helper único, nunca espalhadas.
- Já capturar no MEI os dados que o ME vai precisar (endereço completo,
  tipo PF/PJ do cliente, separação peça x serviço).

### Estoque (feature já pronta em src/features/estoque)

- O saldo real vem SEMPRE do razão (movimentacao_estoque). pecas.qtd é só
  cache. Nunca editar pecas.qtd na mão — sempre via movimento.
- Baixa de peça acontece no momento do USO (na OS ou venda), não no pagamento.
  A tela de Estoque só oferece Entrada (compra) e Ajuste (correção manual,
  com motivo obrigatório); registrarSaida existe no service mas fica reservado
  para as features de OS e Venda de balcão, que sabem a origem da baixa.
- Custo: modelo SIMPLES — último custo sobrescreve pecas.preco_custo. Mas
  gravar o custo histórico em movimentacao_estoque.custo_unit sempre.
- movimentacao_estoque é um razão contábil (append-only): a aplicação só
  cria linhas, nunca edita/apaga uma movimentação existente.
- Peça não é excluída (pode ter histórico) — só desativada (pecas.ativo).

### Ordem de Serviço

- Fluxo: Aberta → Em andamento → Concluída → Faturada.
- Faturamento é SEPARADO da execução. Ao faturar, gera registro(s) em
  financeiro. Três situações de recebimento:
  1. À vista: pago=true, forma preenchida, data_pagamento=hoje
  2. A prazo: pago=false, vencimento=data
  3. Em aberto (fiado): pago=false, vencimento=NULL, amarrado ao cliente
- OS faturada trava para edição (correção só via estorno).

### Financeiro

- Toda saída é financeiro tipo='pagar' com uma `categoria`:
  fornecedor | despesa_fixa | despesa_variavel | imposto | folha |
  retirada_lucro
- REGRA DE OURO: retirada_lucro NUNCA entra no cálculo de lucro (é o
  destino do lucro, não um custo).
- Despesas fixas recorrentes ficam em despesas_fixas e geram contas do mês.

### Impressão (feature já pronta em src/features/impressao)

- Camada única PrinterService. Telas chamam printer.imprimir(doc).
- Fase 1 (atual): método 'browser' (HTML/CSS 80mm). Implementado.
- Fase 2 (futuro): ESC/POS via Web Bluetooth/USB. Interface pronta, stubs
  documentados. Ambiente suporta (Windows/Android Chrome).
- Fase 3 (ao virar ME): NFC-e/NFS-e via API de terceiros. O DANFE vem
  pronto do emissor e entra na mesma camada (campo doc.fiscal).

### Cadastros (feature já pronta em src/features/cadastros)

- Cliente e fornecedor com endereço completo separado em campos.
- Busca automática por CEP via ViaCEP.
- Obrigatoriedade: nome+telefone sempre; endereço completo só quando PJ ou
  quando exigirNota=true.

## Documentos fiscais — cuidado

NÃO implementar emissão fiscal própria falando direto com SEFAZ/prefeitura.
Quando chegar a hora (ME), usar API de terceiros (PlugNotas, Focus, eNotas).
Até lá, o sistema gera COMPROVANTE INTERNO ("sem valor fiscal").

## Ordem de construção sugerida (MVP → completo)

1. Cadastros (clientes, veículos, fornecedores) + Estoque base
2. Ordens de Serviço com baixa de estoque
3. Faturamento + Financeiro (3 situações de recebimento)
4. Vendas de balcão
5. Despesas e categorias financeiras
6. Dashboard + monitor de faturamento MEI
7. Fases futuras: importação XML NF-e, impressão ESC/POS, emissão fiscal
