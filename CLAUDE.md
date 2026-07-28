# Sistema de Gestão para Oficina Mecânica + Loja de Peças

## Sobre o projeto

PWA de gestão para oficina mecânica com loja de peças. Faz controle de
ordens de serviço, estoque, vendas de balcão, financeiro e cadastros.
Usuário único inicialmente (dono da oficina), rodando em Windows e Android.

## Stack

- React + TypeScript + Vite
- Supabase (Postgres + Auth + Storage)
- PWA (instalável, funciona offline nos cadastros/consultas)
- SEM bibliotecas de UI pesadas — CSS próprio, componentes simples.
  Exceção: `lucide-react` pra ícones (só ícones, sem componentes/estilo
  próprio — não conta como framework de UI).

## Instalação do PWA e tema (src/shared)

- `src/shared/hooks/usePwaInstall.ts` + `src/shared/components/InstalarPwaBanner.tsx`:
  banner no topo do app pedindo instalação. Desktop/Android (Chrome/Edge)
  usa o evento `beforeinstallprompt` pra acionar o prompt nativo. iOS
  Safari NUNCA dispara esse evento (Apple não implementa) — lá o banner
  mostra o passo a passo manual (Compartilhar → Adicionar à Tela de
  Início). Navegador nenhum deixa instalar sem gesto do usuário — não dá
  pra "forçar" de verdade, só deixar bem visível (banner fixo no topo,
  fecha com um "soneca" de 7 dias, não pra sempre).
- `src/shared/hooks/useTema.ts` + `src/shared/components/AlternarTema.tsx`:
  alterna claro/escuro, persiste em localStorage (chave `tema`), sem
  preferência salva segue o sistema. Aplica via atributo
  `data-theme` na `<html>`; um script inline no início do `<head>` do
  index.html já aplica isso antes do primeiro paint (evita flash do
  tema errado).
- Cores estruturais (fundo, cartão, texto, borda, hover) viram variáveis
  CSS globais em App.css (`--cor-fundo`, `--cor-fundo-cartao`,
  `--cor-texto`, `--cor-texto-secundario`, `--cor-borda`,
  `--cor-fundo-secundario`, `--cor-fundo-hover`, `--cor-sombra`,
  `--cor-fundo-aviso`/`--cor-borda-aviso`,
  `--cor-fundo-perigo`/`--cor-borda-perigo`) com valores claro/escuro.
  Cada feature (`--cad-*`, `--est-*`, `--os-*`, `--fin-*`, `--vd-*`,
  `--dsp-*`, `--emp-*`) referencia essas variáveis globais nos campos
  estruturais (borda/texto/label/fundo secundário), então ficam
  automaticamente compatíveis com os dois temas. Badges de
  status/categoria (verde/azul/roxo/âmbar) e a cor de marca (vermelho)
  ficam FIXAS nos dois temas de propósito — não são "estruturais".
  Header do app (`.app-header`) também fica sempre escuro nos dois temas
  (chrome de marca, não muda com o toggle).

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

### Múltiplas empresas (feature já pronta em src/features/empresa)

- empresa_config NÃO é singleton — pode ter várias empresas (CNPJs),
  cada uma com seu próprio regime/limite MEI (aba Empresas). Existe
  justamente pra quem opera mais de um CNPJ na mesma oficina física e
  precisa monitorar o limite do MEI de cada um separadamente.
- Clientes, veículos, estoque e Ordens de Serviço continuam
  COMPARTILHADOS entre as empresas (é a mesma oficina) — só o financeiro
  é dividido: `financeiro.empresa_id` e `despesas_fixas.empresa_id`
  dizem a qual empresa cada lançamento/despesa pertence.
- Ao faturar OS, finalizar venda ou lançar conta a pagar, o usuário
  escolhe a empresa no formulário (FormFaturamento, FormFinalizarVenda,
  FormContaPagar, FormDespesaFixa) — se só existe uma empresa
  cadastrada, ela é pré-selecionada automaticamente.
- Dashboard mostra o monitor MEI de TODAS as empresas lado a lado
  (MonitorMeiEmpresa) + os KPIs financeiros detalhados de UMA empresa
  selecionada por vez. Fluxo de Caixa e a lista do Financeiro também
  filtram por empresa.
- ATENÇÃO (avisado ao usuário, decisão dele/contador): se a intenção for
  a MESMA operação faturando por dois CNPJs MEI só pra dividir e não
  estourar o limite de cada um, isso pode ser visto pela Receita como
  faturamento de um negócio só (risco de descaracterização do MEI). Essa
  feature serve tanto pra esse uso quanto pra empresas legitimamente
  distintas — não é papel do sistema decidir isso.

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
- Ao CRIAR uma peça, o formulário aceita quantidade inicial + custo
  unitário — vira a primeira ENTRADA automaticamente
  (criarPecaComEstoqueInicial em pecas.service.ts), pra não obrigar o
  usuário a criar a peça e só depois abrir uma segunda tela pra dar
  entrada. Continua sem editar pecas.qtd/preco_custo direto: por baixo
  dos panos é sempre uma movimentação.
- ENTRADA pede também a empresa (CNPJ) que recebeu a nota do fornecedor
  (movimentacao_estoque.empresa_id, coluna nullable — só 'entrada' usa;
  saída/ajuste não têm CNPJ de nota). É OBRIGATÓRIO no formulário nos 3
  pontos que geram entrada: FormMovimentacao (entrada manual),
  FormPeca (estoque inicial da peça nova) e ImportarXmlNFe (importação
  de XML, que tenta casar o CNPJ do destinatário (`dest`) do XML com uma
  empresa cadastrada e pré-seleciona automaticamente). Mesmo padrão de
  select das telas do financeiro (Empresa; pré-seleciona se só há uma
  cadastrada). ATENÇÃO: isso é só controle/rastreio de qual CNPJ pagou o
  lote — NÃO divide o saldo. pecas.qtd continua somando o razão inteiro,
  compartilhado entre as empresas (mesma oficina física, ver seção
  "Múltiplas empresas" acima).
- "Margem de lucro (%)" no formulário da peça é só uma calculadora:
  sugere preco_venda = custo × (1 + margem/100) a partir do custo
  (digitado, se a peça for nova; cacheado, se estiver editando). O campo
  de preço continua editável manualmente por cima do valor sugerido.

### Importação de XML de NF-e (feature já pronta em src/features/importacao-nfe)

- Só LEITURA de um arquivo XML que o usuário já tem em mãos (nota do
  fornecedor) — não fala com SEFAZ/webservice nenhum. Não conflita com a
  proibição de emissão fiscal própria (isso é import, não emissão).
- Parser (parseNFe.ts) usa o DOMParser nativo do navegador, sem lib
  externa. Lê infNFe/emit/ide/det/prod e a chave de acesso (protNFe/chNFe
  ou o atributo Id do infNFe como fallback).
- Fluxo: escolher XML → sistema tenta casar cada item com uma peça
  existente pelo código (pecas.codigo == cProd da nota); item sem match
  vira "criar peça nova"; usuário revisa/edita quantidade e custo linha a
  linha antes de confirmar. Fornecedor é casado pelo CNPJ (dígitos, sem
  máscara) ou pode ser cadastrado ali mesmo a partir dos dados da nota.
  Empresa (CNPJ da autopeças morais que recebeu a nota) é casada pelo
  CNPJ do destinatário (`dest`, não `emit`) da mesma forma; obrigatório
  escolher antes de confirmar a importação.
- Ao confirmar: cria as peças que faltarem, registra uma ENTRADA
  (registrarEntrada, feature estoque) por item incluído, e grava a nota
  em nfe_importadas (chave_acesso é única) — reimportar a mesma nota é
  bloqueado antes mesmo de mostrar a tela de revisão.
- Acessível pelo botão "Importar XML" na tela de Estoque.

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
- DetalheOS mostra as 4 etapas (Aberta/Em andamento/Concluída/Faturada)
  como uma trilha de progresso animada (EtapasOS — check nas concluídas,
  pulso na atual, conector acende conforme avança), estilo apps de
  entrega. É só apresentação; a lógica de transição continua em
  PROXIMO_STATUS/avancarStatusOS.

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
- Fluxo de Caixa (aba própria) é diferente do faturamento do Dashboard:
  conta por data_pagamento (dinheiro que já entrou/saiu de verdade),
  filtra por período, e mostra saldo anterior (tudo quitado antes do
  período) + saldo acumulado linha a linha. Não é saldo bancário real —
  o app não tem conta/banco cadastrado, é só o acumulado do que passou
  pelo financeiro.
- NÃO existe trava impedindo despesa > receita — é decisão de propósito
  (ficar no vermelho é uma situação real de negócio, não um erro; travar
  impediria registrar uma despesa que já aconteceu de verdade). Em vez
  disso, dois avisos NÃO bloqueantes (window.confirm, dá pra prosseguir):
  1. Ao criar conta a pagar com vencimento no mês corrente, se isso
     zerar/negativar resultadoMes (receita - despesa do mês, ambos por
     competência: faturamento por created_at, despesa por vencimento).
  2. Ao quitar uma conta a pagar, se isso negativar o saldo de caixa do
     mês corrente (via buscarFluxoCaixa, regime de caixa).
  Só avisa na transição de ok pra negativo (se já tava negativo, não
  fica repetindo o aviso a cada novo lançamento).

### Vendas de Balcão (feature já pronta em src/features/vendas)

- Venda avulsa de peça (mão de obra é OS, não entra aqui). Cliente é
  OPCIONAL — só vira obrigatório se a venda for finalizada como a
  prazo/fiado (precisa amarrar a alguém).
- Mesmo padrão da OS: item dá baixa de estoque na hora (registrarSaida),
  remover devolve via AJUSTE, item removido fica marcado (não apagado).
- Finalização reaproveita as mesmas 3 situações de recebimento da OS
  (categoria='venda_balcao' em financeiro) e trava a venda
  (status='finalizada') — mesma ressalva: sem estorno ainda.

### Impressão (feature já pronta em src/features/impressao — Fase 1)

- Camada única PrinterService (printer.imprimir(doc)) — telas não sabem
  COMO a impressão acontece por baixo, só montam um DocumentoImpressao
  genérico (tipo, título, número, cliente, veículo, itens, total,
  observações, fiscal: false) e chamam printer.imprimir(doc).
- Fase 1 (pronta): método 'browser' — monta HTML/CSS pra 80mm num iframe
  escondido e aciona o diálogo de impressão do navegador/SO (funciona com
  qualquer impressora térmica instalada como impressora do Windows/Android
  Chrome). Template em services/template.ts.
- Botão BotaoImprimir (componente reutilizável, sem CSS próprio — herda a
  classe de quem chama) já ligado na OS (DetalheOS). Venda de balcão ainda
  não tem o botão, mas a camada já dá conta — é só montar o
  DocumentoImpressao lá e reaproveitar.
- Comprovante é sempre `fiscal: false` — rodapé fixo "DOCUMENTO SEM VALOR
  FISCAL". Ver regra de documentos fiscais abaixo.
- Fase 2 (futuro): ESC/POS via Web Bluetooth/USB. Só trocaria a
  implementação de imprimir() no printer.service.ts — a assinatura
  printer.imprimir(doc) pras telas continua igual.
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
   - ✅ Impressão (Fase 1: comprovante HTML/CSS 80mm) — pronta, ligada na
     OS. Falta ligar o botão na Venda de balcão (a camada já suporta).
   - Estorno de OS/venda faturada — hoje faturar é via de mão única.
   - RLS: rodei supabase/migrations/rls_policies.sql liberando tudo pra
     anon/authenticated (era o que estava bloqueando TODO insert/update —
     Supabase habilita RLS por padrão e sem policy nenhuma fica tudo
     negado). Isso é PROVISÓRIO: app não tem login ainda, então qualquer
     um com a URL/anon key (públicas por natureza) lê e escreve em
     qualquer tabela. Trocar por policies de verdade quando existir
     Supabase Auth.
8. Fases futuras (fora do MVP):
   - ✅ Importação XML NF-e (entrada de estoque) — feature já pronta em
     src/features/importacao-nfe.
   - Impressão ESC/POS.
   - Emissão fiscal (NFC-e/NFS-e via PlugNotas/Focus/eNotas).
