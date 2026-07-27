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

### Ordem de Serviço (feature já pronta em src/features/ordens-servico)

- Fluxo: Aberta → Em andamento → Concluída → Faturada.
- OS exige cliente e veículo (o veículo tem que estar cadastrado antes).
- Item de peça dá baixa de estoque na hora (registrarSaida) — se não houver
  saldo, a movimentação falha e o item não chega a ser criado. Remover um
  item de peça devolve o estoque via AJUSTE; o item fica marcado como
  removido (com motivo) em vez de apagado.
- Faturamento é SEPARADO da execução. Ao faturar, gera registro(s) em
  financeiro. Três situações de recebimento:
  1. À vista: pago=true, forma preenchida, data_pagamento=hoje
  2. A prazo: pago=false, vencimento=data
  3. Em aberto (fiado): pago=false, vencimento=NULL, amarrado ao cliente
- OS faturada trava para edição (correção só via estorno — estorno ainda
  não foi implementado; hoje faturar é uma via de mão única).

### Financeiro (feature já pronta em src/features/financeiro)

- Tabela única `financeiro` com discriminador `tipo` ('pagar' | 'receber').
- Toda saída é financeiro tipo='pagar' com uma `categoria`:
  fornecedor | despesa_fixa | despesa_variavel | imposto | folha |
  retirada_lucro
- REGRA DE OURO: retirada_lucro NUNCA entra no cálculo de lucro (é o
  destino do lucro, não um custo) — ainda não há cálculo de lucro/dashboard,
  só a regra documentada pra quando existir.
- Despesas fixas recorrentes ficam em despesas_fixas (feature já pronta em
  src/features/despesas) e geram contas do mês por ação explícita ("Gerar
  contas do mês", não é automático/agendado). Índice único
  (despesa_fixa_id, vencimento) em financeiro impede duplicar a mesma
  despesa no mesmo mês — gerar de novo só ignora as que já existem.
- Despesa fixa não é excluída (pode ter contas geradas) — só desativada.

### Vendas de Balcão (feature já pronta em src/features/vendas)

- Venda avulsa de peça (mão de obra é OS, não entra aqui). Cliente é
  OPCIONAL — só vira obrigatório se a venda for finalizada como a
  prazo/fiado (precisa amarrar a alguém).
- Mesmo padrão da OS: item dá baixa de estoque na hora (registrarSaida),
  remover devolve via AJUSTE, item removido fica marcado (não apagado).
- Finalização reaproveita as mesmas 3 situações de recebimento da OS
  (categoria='venda_balcao' em financeiro) e trava a venda
  (status='finalizada') — mesma ressalva: sem estorno ainda.

### Impressão (PENDENTE — src/features/impressao ainda está vazia)

Esta seção descreve uma decisão de arquitetura já tomada, mas o código
NUNCA foi escrito (o texto abaixo veio da conversa original no Claude web
e ficou aqui por engano dizendo "já pronta" — corrigido, ainda é TODO):

- Camada única PrinterService. Telas chamam printer.imprimir(doc).
- Fase 1 (a fazer): método 'browser' (HTML/CSS 80mm).
- Fase 2 (futuro): ESC/POS via Web Bluetooth/USB. Interface pronta, stubs
  documentados. Ambiente suporta (Windows/Android Chrome).
- Fase 3 (ao virar ME): NFC-e/NFS-e via API de terceiros. O DANFE vem
  pronto do emissor e entra na mesma camada (campo doc.fiscal).

### Dashboard (feature já pronta em src/features/dashboard)

- Monitor de faturamento MEI: soma financeiro.valor (tipo='receber',
  categoria in servico_os/venda_balcao) do ano corrente por created_at
  (data do fato gerador — a venda/faturamento, não o recebimento) e
  compara com empresa_config.limite_anual_mei.
- Depende de empresa_config (feature já pronta em src/features/empresa,
  singleton com o campo `regime` que já era arquitetura decidida mas
  nunca tinha sido implementada). Sem configuração, o Dashboard pede pra
  configurar antes de mostrar qualquer número.
- KPIs adicionais: faturamento do mês/ano, a receber pendente, a pagar
  pendente, contas atrasadas (vencidas e não pagas).

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

1. ✅ Cadastros (clientes, veículos, fornecedores) + Estoque base
2. ✅ Ordens de Serviço com baixa de estoque
3. ✅ Faturamento + Financeiro (3 situações de recebimento)
4. ✅ Vendas de balcão
5. ✅ Despesas e categorias financeiras
6. ✅ Dashboard + monitor de faturamento MEI
7. Pendências conhecidas antes de "fases futuras":
   - Impressão (Fase 1: comprovante HTML/CSS 80mm) — arquitetura decidida,
     nunca implementada (ver seção acima).
   - Estorno de OS/venda faturada — hoje faturar é via de mão única.
   - RLS das tabelas no Supabase — revisar antes de expor o app publicamente.
8. Fases futuras (fora do MVP): importação XML NF-e, impressão ESC/POS,
   emissão fiscal (NFC-e/NFS-e via PlugNotas/Focus/eNotas)
