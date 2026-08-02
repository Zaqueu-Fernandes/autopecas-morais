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
- `src/shared/components/Rodape.tsx`: créditos + contato, centralizado,
  no fim de toda página — montado uma vez em App.tsx (depois de
  `<main>`, aparece em todas as abas) e uma vez em LoginPage.tsx (a
  única tela fora do layout principal). Ano do copyright é dinâmico
  (`new Date().getFullYear()`). WhatsApp usa um SVG inline (lucide-react
  não tem ícone de marca) linkando pra `https://wa.me/<DDI+DDD+número>`
  — abre o WhatsApp Web/app direto na conversa, sem precisar salvar o
  contato.
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
- Identidade visual: fonte única `public/icones/img2d_brilhosa.png.png`
  (sim, extensão duplicada no nome — veio assim de um rename acidental
  fora da sessão, não mexer). Essa arte é um recorte mais fechado do
  mesmo desenho 2D (sem a moldura/bezel metálico nem a tag "CUIDANDO DA
  VIDA DO SEU CARRO" que a versão anterior tinha) — 1090×1039, fundo
  escuro preenchendo o quadro inteiro, SEM cantos arredondados próprios
  (diferente das artes anteriores, que já vinham com bezel arredondado
  embutido). Já teve outras 2 versões antes dessa (histórico, arquivos
  ainda no repo sem uso: `IconPage.png`/`IconePWA.png`; depois
  `Iconeapp.png`, versão 3D fotorrealista, trocada por pedido do usuário —
  "não ficou muito legal o ícone 3D"). ATENÇÃO: desde que a logo sem fundo
  foi criada (ver abaixo), essa arte-fonte NÃO alimenta mais os 3 usos
  igual antes — dois pipelines diferentes partem dela agora:
  - **Ícone do PWA** (`pwa-icon-512.png`, `pwa-icon-192.png`,
    `favicon-64.png`, todos em `public/`, todos com FUNDO ESCURO —
    intencional, ícone instalado precisa de fundo sólido, principalmente
    o purpose `maskable` do manifest: sem fundo, launcher Android pode
    cortar de um jeito que "flutua"/corta mal). Gerados uma vez com
    `sharp` (script descartável, não faz parte do projeto): 1)
    redimensiona/recorta pra quadrado 1024×1024 (`fit: 'cover'`,
    centrado — essa arte não tem moldura pra alinhar por luminância
    como as anteriores); 2) aplica máscara SVG de cantos arredondados
    ~18% do tamanho (`dest-in`) — como a arte NÃO tem cantos próprios,
    a máscara faz o trabalho inteiro de criar a transparência
    arredondada; 3) exporta os 3 arquivos (manifest, vite.config.ts,
    purpose 'any' e 'maskable' com o MESMO arquivo — simplificação: não
    tem margem de segurança própria pra maskable, se algum launcher
    cortar em círculo pode tocar no conteúdo perto da borda), com
    `png({ palette: true })` (quantização de cores, tipo pngquant) pra
    manter leve (512px ficou com ~73KB). Continua sem mudança nenhuma.
  - **Logo sem fundo** (`public/logo-transparente.png`, 420×400,
    ~36KB), usada em `.auth-logo` (LoginPage.tsx) e `.app-logo`
    (App.tsx, cabeçalho) — pedido do usuário (o quadrado escuro em
    volta da logo, em cima do card branco da tela de login, ficava
    feio). Gerada uma vez com `sharp` (script descartável) a partir da
    MESMA arte-fonte, removendo o fundo escuro por chave de luminância
    (pixels de fundo têm luminância ~19-39; os elementos desenhados —
    carro prata, chave/texto vermelho — ficam ~65+; threshold 40-58 com
    descontaminação de borda, assumindo blend linear contra o fundo
    amostrado, pra não sobrar franja escura nos contornos). Sobra um
    artefato pequeno (um brilho/glow claro que fazia parte da arte
    original no canto superior-esquerdo, que só "sumia" antes por
    blender com o fundo escuro ao redor — sem fundo ele aparece como uma
    manchinha clara) mas é imperceptível no tamanho real de exibição
    (60-64px); não vale o risco de mascarar manualmente perto do arco
    cinza do desenho pra tirar. Essa mesma logo sem fundo é reaproveitada
    (embutida em base64, ver `src/features/impressao/services/
    logoBase64.ts`) no cabeçalho dos relatórios PDF (`pdf.service.ts`) e
    da impressão em A4/Carta — comprovante (`template.ts`) e lista
    (`templateLista.ts`); térmica 80mm não leva logo (bobina estreita,
    prioriza espaço pro conteúdo). Base64 em vez de referenciar o arquivo
    por URL porque o jsPDF precisa do dado da imagem de forma síncrona
    (`addImage`) e os templates de impressão precisam funcionar offline
    (PWA).
  - Se a arte-fonte mudar de novo, regenerar os DOIS pipelines
    separadamente com a mesma técnica cada um (não editar os PNGs
    gerados na mão, nem a base64 do logoBase64.ts).
  - `vite.config.ts` tem `workbox.globIgnores: ['icones/**']` — sem
    isso, o precache do service worker varreria as artes-fonte
    (inclusive as antigas, ainda no repo) junto com o app, inflando o
    cache offline à toa. `logo-transparente.png` fica em `public/`
    (fora de `icones/`), igual os ícones do PWA — entra no precache
    normalmente, pra aparecer mesmo offline.

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
  Ativar/Desativar fica na lista (EstoquePage, botão ao lado de Editar,
  mesmo padrão de Despesas Recorrentes/Categorias), não mais um checkbox
  dentro do formulário — checkbox era redundante E, pior, uma vez
  desativada a peça sumia da lista sem jeito de reverter pela UI (não
  tinha toggle "Mostrar inativas" até então). Corrigido.
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
  de preço continua editável manualmente por cima do valor sugerido. NÃO
  é salva no banco — não tem coluna de margem em pecas — então, ao editar
  uma peça já existente, o valor inicial do campo é CALCULADO na hora a
  partir de precoCusto/precoVenda cacheados (só pra não nascer em branco;
  se você editar o preço de venda direto depois, a margem mostrada não
  se atualiza sozinha até reabrir a tela).
- DEVOLUÇÃO AO FORNECEDOR (registrarDevolucaoFornecedor, terceiro botão em
  MovimentacoesDaPeca, ao lado de Entrada/Ajustar): peça que já tinha dado
  ENTRADA sai de novo do estoque por defeito ou nota fiscal cancelada.
  Sempre um AJUSTE negativo (não é venda/uso real, nem devolução de
  cliente — é a compra que não vale mais), então nunca mexe em
  preco_custo. Cada motivo vira uma `origem` própria (
  devolucao_fornecedor_defeito / devolucao_fornecedor_nfe_cancelada, em
  vez do genérico 'ajuste_manual'), pra dar pra filtrar/relatar cada
  situação separadamente no histórico da peça — foi por isso que também
  entrou ROTULO_ORIGEM em MovimentacoesDaPeca.tsx (rótulo amigável pra
  origem + observações juntos na lista, em vez de só observações cru).
  IMPORTANTE (decisão consciente, não pendência): isso cobre só o lado do
  ESTOQUE. Compra de fornecedor não tem link com o lançamento financeiro
  que paga ela (diferente de OS/venda, que tem os_id/venda_id) — uma
  conta a pagar de fornecedor pode cobrir várias entradas, então não dá
  pra automatizar qual lançamento estornar. Se a nota já foi paga, o
  ajuste financeiro é manual: Estornar (ou Excluir, se ainda pendente) na
  tela Financeiro.

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
- **"Baixar XML de Nota Fiscal"** (botão ao lado de "Importar XML", mesma
  tela) é DIFERENTE — não faz nada sozinho, só abre numa aba nova a URL de
  um serviço externo (configurada pelo admin) onde o usuário cola a chave
  de acesso de 44 dígitos manualmente e baixa o XML por fora, pra depois
  importar aqui do jeito de sempre. Não existe integração automática
  "chave → itens": a chave sozinha não carrega os dados da nota, só um
  webservice autenticado da SEFAZ (exige certificado digital) ou um
  serviço terceiro pago (PlugNotas/Focus/eNotas) conseguiriam buscar isso
  de verdade — decisão consciente de NÃO implementar nenhum dos dois por
  enquanto (mesma cautela de "Documentos fiscais" abaixo), então o botão é
  só um atalho de conveniência pra um passo manual que já existia.
  - URL configurável em Admin > URL para baixar XML (`ConfiguracoesPage.tsx`,
    feature `src/features/configuracoes`, tabela `configuracoes_sistema`
    — chave/valor genérico, pensado pra guardar outras configurações
    futuras do sistema também, não só essa). RLS: qualquer logado LÊ, só
    admin ESCREVE (mesmo padrão `is_admin()` de `permissoes_usuario`).
    Sem URL cadastrada, o botão mostra um aviso em vez de abrir algo.

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
- OS faturada trava para edição (correção só via estorno — ver "Estorno e
  exclusão de lançamento" em Financeiro. Estornar o lançamento de
  faturamento dessa OS destrava ela de volta pra 'concluida').
- DetalheOS mostra as 4 etapas (Aberta/Em andamento/Concluída/Faturada)
  como uma trilha de progresso animada (EtapasOS — check nas concluídas,
  pulso na atual, conector acende conforme avança), estilo apps de
  entrega. É só apresentação; a lógica de transição continua em
  PROXIMO_STATUS/avancarStatusOS.

### Financeiro (feature já pronta em src/features/financeiro)

- **Navegação**: "Financeiro" é uma aba PAI (`src/pages/FinanceiroPage.tsx`,
  mesmo padrão de `CadastrosPage`/`AdministracaoPage`) com 4 sub-abas:
  **Contas a Pagar** (`ContasPagarPage.tsx`, `tipo='pagar'`) e **Contas a
  Receber** (`ContasReceberPage.tsx`, `tipo='receber'`) concentram as AÇÕES
  (lançar manual, quitar, editar valor, excluir, estornar — ver "Receita
  Avulsa" abaixo pro lançamento manual do lado receber); **Extrato**
  (`ExtratoFinanceiroPage.tsx`) é só CONSULTA — despesas e receitas juntas,
  filtros, impressão/PDF, badge de oculto, sem NENHUM botão de ação; **Fluxo
  de Caixa** (`FluxoCaixaPage.tsx`, inalterada) entra debaixo do mesmo
  guarda-chuva. Antes as 4 coisas viviam numa tela só ("Financeiro"
  misturava listar com agir) — separado a pedido do usuário, pra não
  confundir "ver o extrato" com "mexer num lançamento". Os avisos de
  "resultado do mês negativo"/"saldo de caixa negativo" (ver "NÃO existe
  trava..." abaixo) moraram sempre em quem quita despesa, então ficaram em
  Contas a Pagar. A ocultação por usuário (ver "Ocultar Pagamentos em
  Dinheiro" em Autenticação) só faz sentido pra receita — aparece em Contas
  a Receber e no Extrato, nunca em Contas a Pagar.
- **Receita Avulsa** (`CategoriaReceber` ganhou um 4º valor,
  `'receita_avulsa'`, ao lado de `servico_os`/`venda_balcao`/`estorno`):
  único jeito de lançar uma receita manualmente, via "Nova conta a receber"
  (`FormContaReceber.tsx`) em Contas a Receber. Diferente de
  `CategoriaPagar` (texto livre, validado contra o cadastro de Categorias),
  `CategoriaReceber` é um enum FECHADO — não tem cadastro de categorias de
  receita, então "Receita Avulsa" é a única opção pra dinheiro que não vem
  de faturar OS nem finalizar venda (ex.: reembolso de terceiro, serviço
  cobrado fora do fluxo normal). `servico_os`/`venda_balcao` continuam
  IMPOSSÍVEIS de lançar manualmente — só nascem do faturamento automático.
  O formulário avisa explicitamente que venda de peça deve sempre passar
  por Vendas de Balcão (é o que dá baixa no estoque) — "Receita Avulsa" não
  filtra nem valida isso no banco, é só um aviso de texto pro usuário não
  usar como atalho e furar o controle de estoque sem querer. Mesmo padrão
  de "Nova conta a pagar": nasce com `empresaId: null` ("Empresa a
  Definir") e `pago: false`; Cliente é opcional (não trava o lançamento).
  ARMADILHA (já caiu nela uma vez): diferente do lado `pagar` — cuja
  `categoria` é texto livre validado só na aplicação — o lado `receber`
  ainda tem um CHECK constraint de verdade no banco (`financeiro_check`,
  ver `financeiro_receita_avulsa.sql`) travando os valores aceitos. Se um
  valor novo de `CategoriaReceber` for adicionado no TypeScript sem
  atualizar esse CHECK também, o INSERT quebra no banco (23514) mesmo com a
  validação da aplicação passando — sempre migration nova (drop-e-recria o
  constraint, mesmo padrão do arquivo citado) junto de qualquer valor novo.
- "Nova conta a pagar" (`FormContaPagar.tsx`) e "Nova conta a receber"
  (`FormContaReceber.tsx`) têm DOIS botões cada, em vez de um — mesmo
  padrão espelhado nos dois lados: **"Salvar e Pagar/Receber Depois"**
  (fluxo de sempre — cria pendente, volta pra lista) e **"Salvar e Pagar/
  Receber Agora"** (cria E já abre "Registrar pagamento"/"Registrar
  recebimento" em seguida, equivalente a criar e clicar em "Quitar" na
  sequência). `onSalvar(dados, pagarAgora/receberAgora: boolean)` — quem
  decide o que fazer com a flag é `ContasPagarPage.handleSalvarContaPagar`/
  `ContasReceberPage.handleSalvarContaReceber`: se a flag for true, guarda
  o lançamento recém-criado (retornado por `criarLancamento`) em
  `lancamentoParaQuitar` em vez de recarregar a lista.
- Tabela única `financeiro` com discriminador `tipo` ('pagar' | 'receber').
- Toda saída é financeiro tipo='pagar' com uma `categoria` (chave de
  categorias_despesa — ver "Categoria virou cadastro do usuário" abaixo).
  Nascem protegidas: fornecedor | despesa_geral | imposto | folha |
  retirada_lucro — mas o usuário pode cadastrar mais em Cadastros >
  Categorias.
- REGRA DE OURO: retirada_lucro NUNCA entra no cálculo de lucro (é o
  destino do lucro, não um custo) — ainda não há cálculo de lucro/dashboard,
  só a regra documentada pra quando existir.
- Conta financeira (feature @/features/contas-financeiras, tabela
  contas_financeiras, tela em Cadastros > Contas Financeiras) — cadastro
  simples do usuário: `tipo` ('banco' | 'carteira' | 'cartao' |
  'investimento') + `instituicao` (nome do banco, ou label livre tipo
  "Caixa da loja") + `empresa_id` (nullable — ver
  contas_financeiras_empresa.sql). Uma conta vinculada a uma empresa só
  aparece pra escolher nos lançamentos DAQUELA empresa; sem empresa
  definida, é COMPARTILHADA e aparece pra qualquer uma (útil pra
  "Carteira", dinheiro em espécie da loja física, que não é de um CNPJ só).
  `listarContasFinanceiras({ empresaId })` filtra `empresa_id = X OU IS
  NULL`. Os 4 formulários que pedem conta (ver abaixo) reagem à Empresa já
  escolhida no mesmo fluxo — o select de Conta recarrega (e limpa a
  seleção anterior se ela não pertencer mais à lista nova) toda vez que a
  empresa muda: em FormFaturamento/FormFinalizarVenda a empresa é
  escolhida no próprio form; em FormQuitacao/FormEstorno a empresa já
  vem do lançamento original (props `empresaId`/`precisaEmpresa`) — não
  há select de empresa nesses dois quando ela já existe, só filtro
  silencioso. Todo lançamento que efetivamente MOVIMENTA dinheiro (fica
  pago=true) exige uma conta,
  obrigatório, sempre junto de `forma_pagamento` (que já existia — agora são
  pedidos em par nos 4 pontos que coletam forma de pagamento): Quitar
  (FormQuitacao), Faturar OS à vista (FormFaturamento), Finalizar venda à
  vista (FormFinalizarVenda), e Estorno/Devolução quando já havia dinheiro
  envolvido (FormEstorno, cobre tanto estornarLancamento quanto
  devolverItem/devolverItemVenda). `financeiro.conta_financeira_id`
  (nullable — só null enquanto pendente, igual forma_pagamento). "Nova conta
  a pagar" (FormContaPagar) e despesa recorrente não pedem conta na criação
  — só existe conta de verdade quando o dinheiro sai/entra, não quando a
  obrigação é registrada. PENDÊNCIA FUTURA: "saldo por conta" no Fluxo de
  Caixa (ver "Ordem de construção" no fim deste arquivo) — a coluna já
  existe e é obrigatória, só falta a tela agregar/filtrar por ela.
- Estorno e exclusão de lançamento (src/features/financeiro/services/
  estorno.service.ts + excluirLancamento em financeiro.service.ts): nunca
  se apaga um lançamento já quitado ou vinculado a OS/venda — isso some com
  rastro contábil e pode desincronizar estoque/OS sem avisar (foi
  literalmente o problema resolvido na mão numa limpeza de dados de teste
  antes dessa feature existir). Duas ações, condicionais ao estado do
  lançamento:
  - **Excluir** (de verdade, `financeiro.delete`): só permitido pra
    lançamento PENDENTE (pago=false) E sem `osId`/`vendaId` — ou seja,
    uma "Nova conta a pagar" manual digitada errada, sem nenhuma cascata.
    Validado no SERVICE (não só escondendo o botão), lança erro se não
    for elegível.
  - **Estornar** (`estornarLancamento`): pra tudo mais — já quitado
    (qualquer origem) OU vinculado a OS/venda (mesmo pendente). Marca o
    original com `estornado=true/estornado_em/estornado_motivo`
    (preservado, some das contas de faturamento/pendências —
    dashboard.service.ts filtra `estornado=false`, mas fluxoCaixa.service.ts
    NÃO filtra, de propósito: fluxo de caixa é o diário do que realmente
    aconteceu, os dois movimentos de caixa — o original e a devolução —
    devem aparecer cada um na sua data real). Se o original já estava
    pago/recebido, gera um lançamento de CONTRAPARTIDA (tipo invertido,
    categoria protegida 'estorno', mesmo valor, pago=true,
    data_pagamento=agora, `estornoDeId` apontando pro original) —
    representa o dinheiro saindo/voltando de verdade. Categoria 'estorno'
    é filtrada FORA dos seletores manuais (FormContaPagar/
    FormDespesaFixa) — só o próprio estorno usa. Se o original tem osId,
    destrava a OS de volta pra 'concluida'; se tem vendaId, destrava a
    venda de volta pra 'aberta' (mesma exceção de nomenclatura de
    faturamento.service.ts/venda.service.ts: atualiza só o campo status
    dessas tabelas direto, sem importar código das features de lá).
  - Devolução de item (peça OU serviço) de uma OS faturada/venda finalizada:
    `devolverItem` (ordens-servico/services/itens.service.ts) e
    `devolverItemVenda` (vendas/services/itens.service.ts) — botão
    "Devolver" aparece no lugar de "Remover" quando a OS/venda já está
    travada (`ListaItensOS`/`ListaItensVenda`, reaproveita o componente
    FormEstorno pra pedir motivo + forma de pagamento). Diferente de
    `removerItem`/`removerItemVenda` (usado ANTES de faturar, só mexe em
    estoque): devolução também resolve o financeiro, buscando o
    lançamento de faturamento ainda válido da OS/venda
    (`buscarLancamentoDeOS`/`buscarLancamentoDeVenda`) e decidindo pelo
    estado dele:
      - Já pago: gera um lançamento de REEMBOLSO (categoria 'estorno',
        mesmo mecanismo do estorno de lançamento inteiro, só que pelo
        valor do ITEM, não da OS/venda toda).
      - Ainda pendente (a_prazo/fiado): ninguém pagou nada ainda, então só
        reduz o valor a receber (atualizarValorLancamento); se a
        devolução zerar o total, estorna o lançamento inteiro
        (estornarLancamento) — que já destrava a OS/venda de volta.
    Peça devolvida volta ao estoque via AJUSTE (não ENTRADA) — mesmo
    mecanismo de remoção pré-faturamento, pra não sobrescrever
    preco_custo com o valor de VENDA devolvido (isso contaminaria o custo
    médio da peça). Item marcado como `removido=true` com
    `motivo_remocao` prefixado "Devolução:" (mesma coluna de sempre — não
    criou campo novo, devolução é conceitualmente "remover item depois de
    faturado").
- Despesas fixas recorrentes ficam em despesas_fixas (feature já pronta em
  src/features/despesas) e geram contas do mês por ação explícita ("Gerar
  contas do mês", não é automático/agendado). Índice único
  (despesa_fixa_id, vencimento) em financeiro impede duplicar a mesma
  despesa no mesmo mês — gerar de novo só ignora as que já existem.
- Despesa recorrente é GLOBAL, SEM empresa (`despesas_fixas.empresa_id` foi
  removida — decisão do usuário, que opera múltiplas empresas no mesmo
  controle: travar o molde recorrente numa empresa específica presumia que
  quem paga é sempre a mesma, o que nem sempre é verdade — o pagador real
  pode variar mês a mês). "Gerar contas do mês" (gerarContasDoMes, sem mais
  parâmetro de empresa) roda pra TODAS as despesas ativas de uma vez e cria
  cada lançamento com `empresa_id = null`. Enquanto esse lançamento estiver
  PENDENTE, a lista do Financeiro mostra a badge laranja "Empresa a Definir"
  no lugar do nome da empresa (ContasPagarPage.tsx/ContasReceberPage.tsx/
  ExtratoFinanceiroPage.tsx, classe `.fin-badge-empresa-definir`). No
  momento de clicar "Quitar" é que a empresa pagadora de verdade é exigida
  — FormQuitacao recebe uma prop `precisaEmpresa` que, quando true, mostra
  um select de Empresa obrigatório ANTES da forma de pagamento/conta;
  `quitarLancamento` grava o `empresa_id` junto com pago=true. Em **Contas
  a Pagar** (ContasPagarPage.tsx), `precisaEmpresa` é passado sempre `true`
  — o select de Empresa aparece em TODO "Registrar pagamento", mesmo que o
  lançamento já tenha uma empresa associada (decisão do usuário: quer
  confirmar/poder trocar a empresa pagadora sempre nesse momento, não só
  quando ainda está "a definir"). Em **Contas a Receber**
  (ContasReceberPage.tsx), continua condicional —
  `precisaEmpresa={lancamento.empresaId === null}` — porque a maioria das
  receitas já chega com empresa definida desde o faturamento de OS/venda, e
  ali não foi pedido pra sempre perguntar de novo. "Nova conta a pagar"
  (FormContaPagar, lançamento manual) e "Nova conta a receber"
  (FormContaReceber) nascem com `empresaId: null` — o select de Empresa
  saiu desses formulários e foi pro Quitar (decisão do usuário: só faz
  sentido saber quem paga/recebe no momento em que o dinheiro sai/entra de
  verdade). Faturar OS e Finalizar venda são os únicos que CONTINUAM
  exigindo empresa na CRIAÇÃO — ali o dinheiro entra imediatamente (à vista)
  ou o cliente já sabe de qual CNPJ é a nota, então não faz sentido adiar.
- Registrar pagamento/recebimento (FormQuitacao) também pede a **Data do
  Pagamento** (`DadosQuitacao.dataPagamento`, obrigatória, default hoje mas
  editável) — dá pra quitar retroativamente com a data real em vez de
  travar em "agora" (`quitarLancamento(id, formaPagamento, contaFinanceiraId,
  dataPagamento, empresaId?)`). O aviso de "resultado do mês vai ficar
  negativo" (ver "NÃO existe trava..." abaixo) roda AQUI agora (junto do
  aviso de saldo de caixa que já existia), não mais na criação da conta a
  pagar — só dá pra calcular por empresa depois que ela é conhecida.
- Quando a forma de pagamento é "Dinheiro", o campo Conta some e não é mais
  exigido (dinheiro não passa por banco/cartão, não tem o que rastrear) —
  `financeiro.conta_financeira_id` fica null nesse caso específico, exceção
  à regra de "todo lançamento pago=true exige conta" (ver Contas
  Financeiras acima). Vale nos 4 pontos que coletam forma de pagamento +
  conta juntos: Faturar OS e Finalizar venda (`FormFaturamento`/
  `FormFinalizarVenda`, campo `situacao='a_vista'`), e Quitar
  (`FormQuitacao`, usado tanto por "Registrar pagamento" em Contas a Pagar
  quanto por "Registrar recebimento" em Contas a Receber — um fix cobre os
  dois). Cada form limpa `contaFinanceiraId` no próprio `onChange` do select
  de forma de pagamento ao trocar pra dinheiro, pra não mandar uma conta
  escondida sem o usuário perceber.
- Ordens de Serviço e Vendas de Balcão, na tabela de listagem, ganharam
  colunas extras só preenchidas quando o registro já foi faturado/finalizado
  (senão mostram "—"): OS ganha Empresa + Forma de Pagamento após Status;
  Venda ganha Valor + Empresa + Forma de Pagamento após Status. Nenhuma das
  duas tabelas guarda esse dado — vem do lançamento em `financeiro` via
  `os_id`/`venda_id`, buscado em lote por `buscarLancamentosPorOS`/
  `buscarLancamentosPorVenda` (financeiro.service.ts) e mesclado na página
  (não nos services de ordens-servico/vendas, que não são donos da tabela
  financeiro). Contas a Pagar/Contas a Receber/Extrato, nas próprias
  listas, ganharam Forma de Pagamento + Data Pagamento após Valor,
  preenchidas só quando `pago=true` — e os relatórios impressos/PDF de
  todas as listas de OS, Vendas, Contas a Pagar/Receber, Extrato e Fluxo de
  Caixa foram alinhados pra sempre espelhar as MESMAS colunas que aparecem
  na tela (antes vários ficavam pra trás, mostrando só um subconjunto).
- OS ganhou também uma coluna **Valor**, após Forma de Pagamento, mostrada
  quando o status é `concluida` OU `faturada` (não só faturada — diferente
  de Empresa/Forma de Pagamento, que dependem de um lançamento em
  `financeiro` já existir). Calculada como a soma dos itens NÃO removidos
  (quantidade × valor_unit, mesma conta de "Total" em ListaItensOS.tsx) via
  `buscarValoresPorOS` (itens.service.ts, bulk igual a
  buscarLancamentosPorOS) — não vem do financeiro porque uma OS
  "Concluída" ainda não foi faturada, não tem lançamento nenhum ainda; pra
  uma OS "Faturada", esse valor bate exatamente com o que foi faturado.
- Comprovante impresso (`src/features/impressao`) ganhou uma coluna
  **Item** antes de Descrição, nos dois formatos (térmica 80mm e A4/Carta,
  `template.ts`). `ItemImpressao.tipo?: 'peca' | 'servico'` é opcional —
  só a OS (`DetalheOS.tsx`) preenche de verdade (espelha `ItemOS.tipo`);
  Venda de Balcão (`DetalheVenda.tsx`, só vende peça) não preenche esse
  campo de propósito, e o template cai no fallback "Peça" pra qualquer item
  sem `tipo` (`rotuloItem()`) — decisão consciente de não complicar o
  template com um branch condicional só pra esconder a coluna na Venda.
- Extrato ganhou um filtro por Forma de Pagamento (select simples, usa o
  `formaPagamento` novo em `listarFinanceiro`) e o mesmo rótulo "Em Aberto"
  no Vencimento que Contas a Receber já tinha (`rotuloVencimento()`,
  duplicada nas duas páginas — lançamento fiado, pendente, sem data
  marcada). Fluxo de Caixa ganhou a coluna **Forma de Pagamento/
  Recebimento** após Descrição (`MovimentoCaixa.formaPagamento`, novo em
  `fluxoCaixa.service.ts` — só existe porque todo movimento ali já é
  `pago=true`, então sempre tem forma de pagamento preenchida).
- Página/menu chama-se "Despesas Recorrentes" (era "Despesas Fixas") —
  nomes internos (DespesaFixa, despesas_fixas, FormDespesaFixa,
  DespesasFixasPage) continuam iguais de propósito, só o texto visível
  pro usuário mudou.
- Despesa recorrente tem `tipo_valor` ('fixo' | 'variavel'): fixo
  (aluguel, mensalidade) usa o campo valor como o valor real; variável
  (água, luz — tem vencimento fixo mas o valor muda todo mês) trata o
  valor cadastrado como MÉDIA/estimativa só pra gerar a conta. O valor
  real de cada mês é corrigido depois em Financeiro, num lançamento ainda
  pendente, via "Editar valor" (atualizarValorLancamento) — antes de
  quitar. "Editar valor" existe pra QUALQUER lançamento pendente (não só
  os vindos de despesa variável), pago ou a receber — é intencionalmente
  genérico em vez de restrito, pra também cobrir "Nova conta a pagar"
  digitada com valor errado.
- Despesa recorrente tem `periodicidade` ('semanal' | 'mensal' | 'anual')
  — eixo INDEPENDENTE de tipo_valor (uma despesa anual pode ser fixa ou
  variável). Muda o que `dia_vencimento` significa: mensal = dia do mês
  (1-28, como sempre foi); anual = dia do mês + `mes_vencimento` (1-12);
  semanal = dia da semana (0=domingo…6=sábado). "Gerar contas do mês"
  (gerarContasDoMes → calcularVencimentosDoMes) calcula quais vencimentos
  caem dentro do mês de referência pra cada despesa: mensal sempre gera 1;
  anual só gera no mês certo (0 nos demais); semanal pode gerar vários no
  mesmo mês (um por dia da semana escolhido que cair naquele mês). O
  índice único (despesa_fixa_id, vencimento) continua sendo o que evita
  duplicar, então isso funciona sem precisar guardar "última geração" em
  lugar nenhum. financeiro também ganhou `periodicidade` (nullable — só
  lançamento GERADO de despesa recorrente carrega isso; lançamento manual
  fica NULL), só pra mostrar a tag na lista sem precisar de join.
- Categoria de despesa/lançamento a pagar perdeu 'despesa_fixa' e
  'despesa_variavel', fundidas numa única 'despesa_geral' ("Despesa
  geral"): com tipo_valor e periodicidade já existindo como campos
  próprios, ter uma categoria chamada "fixa" (que podia conviver com
  tipo_valor='variavel' — contraditório) só confundia. fornecedor/
  imposto/folha/retirada_lucro continuam — são classificação contábil de
  verdade (a REGRA DE OURO de retirada_lucro nunca entrar no lucro
  depende de distinguir essa categoria das outras). Migration faz backfill
  das linhas antigas (despesas_fixas.categoria e financeiro.categoria)
  pra 'despesa_geral'.
- Categoria virou cadastro do usuário (feature @/features/categorias,
  tabela categorias_despesa, tela em Cadastros > Categorias) em vez de
  lista fixa. `despesas_fixas.categoria` e `financeiro.categoria`
  CONTINUAM texto simples (não viraram FK de verdade) — o que muda é que
  o valor gravado (a `chave` da categoria) agora é validado contra essa
  tabela na aplicação, não mais por CHECK constraint. `chave` é estável
  (nunca muda, mesmo editando); `nome` é só o rótulo, editável à vontade.
  As 5 categorias originais (fornecedor, despesa_geral, imposto, folha,
  retirada_lucro) nascem com `protegida=true`: dá pra renomear o rótulo,
  mas não pra desativar/excluir — código ainda faz `categoria ===
  'fornecedor'` (mostra o select de fornecedor) e a REGRA DE OURO de
  retirada_lucro depende dessas chaves ficarem estáveis. Categoria criada
  pelo usuário pode ser desativada sempre, e excluída de verdade só se
  nunca tiver sido usada em nenhuma despesa/lançamento (checado na
  aplicação via categoriaEmUso — sem FK real pra banco recusar sozinho).
- Despesa fixa não é excluída por padrão (pode ter contas geradas,
  financeiro.despesa_fixa_id aponta pra ela) — o normal é "Desativar" (só
  para de gerar contas novas). "Excluir" existe (Trash2, ao lado de
  Editar na lista) mas só funciona quando a despesa NUNCA gerou nenhuma
  conta — o banco recusa (FK 23503) se já gerou, e a página troca isso
  por uma mensagem sugerindo Desativar em vez de excluir. Lista tem
  toggle "Mostrar inativas" (senão uma despesa desativada some da lista
  pra sempre, sem jeito de reativar pela UI).
- Fluxo de Caixa (aba própria) é diferente do faturamento do Dashboard:
  conta por data_pagamento (dinheiro que já entrou/saiu de verdade),
  filtra por período, e mostra saldo anterior (tudo quitado antes do
  período) + saldo acumulado linha a linha. Não é saldo bancário real —
  o app não tem conta/banco cadastrado, é só o acumulado do que passou
  pelo financeiro.
- NÃO existe trava impedindo despesa > receita — é decisão de propósito
  (ficar no vermelho é uma situação real de negócio, não um erro; travar
  impediria registrar uma despesa que já aconteceu de verdade). Em vez
  disso, dois avisos NÃO bloqueantes (`confirmar()`, ver "Diálogos de
  confirmação e aviso" mais abaixo — dá pra prosseguir), os DOIS disparados
  em `handleQuitar` (ContasPagarPage.tsx), no momento de "Registrar
  pagamento" — não mais na criação da conta a pagar, já que a empresa só é
  conhecida a partir daqui (ver "Empresa mudou de tela" acima):
  1. Ao quitar uma conta a pagar com vencimento no mês corrente, se isso
     zerar/negativar resultadoMes (receita - despesa do mês, ambos por
     competência: faturamento por created_at, despesa por vencimento) da
     empresa escolhida.
  2. Ao quitar uma conta a pagar, se isso negativar o saldo de caixa do
     mês corrente (via buscarFluxoCaixa, regime de caixa) da mesma empresa.
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
  (status='finalizada') — correção via estorno do lançamento (ver Financeiro),
  que destrava a venda de volta pra 'aberta'.

### Impressão (feature já pronta em src/features/impressao — Fase 1)

- Camada única PrinterService (printer.imprimir(doc)) — telas não sabem
  COMO a impressão acontece por baixo, só montam um DocumentoImpressao
  genérico (tipo, título, número, cliente, veículo, itens, total,
  observações, fiscal: false) e chamam printer.imprimir(doc).
- Fase 1 (pronta): método 'browser' — monta um HTML/CSS num iframe escondido
  e aciona o diálogo de impressão do navegador/SO (funciona com qualquer
  impressora instalada como impressora do Windows/Android Chrome). Dois
  formatos possíveis — térmica 80mm ou A4/Carta — escolhidos por uma
  PREFERÊNCIA GLOBAL (useFormatoImpressao, localStorage, botão no cabeçalho
  ao lado do tema — mesmo padrão do useTema), não perguntada a cada clique.
  Templates em services/template.ts (comprovante, uma versão por formato).
- Botão BotaoImprimir (componente reutilizável, sem CSS próprio — herda a
  classe de quem chama) já ligado na OS (DetalheOS). Venda de balcão ainda
  não tem o botão, mas a camada já dá conta — é só montar o
  DocumentoImpressao lá e reaproveitar.
- Comprovante é sempre `fiscal: false` — rodapé fixo "DOCUMENTO SEM VALOR
  FISCAL". Ver regra de documentos fiscais abaixo.
- IMPRESSÃO DE LISTA (diferente do comprovante — que é 1 documento de uma
  OS/venda): toda tela com `pg-tabela` (Clientes, Fornecedores, Empresas,
  Categorias, Estoque, Despesas Recorrentes, Financeiro, Fluxo de Caixa, OS,
  Vendas) tem os botões "Imprimir" e "Gerar PDF" (componente
  BotoesImpressaoLista, cabeçalho da página, herda a classe *-btn-sec de
  quem chama). Documento genérico: `{ titulo, subtitulo?, colunas: string[],
  linhas: string[][] }` (DocumentoListaImpressao) — cada página monta as
  linhas já formatadas como texto (mesmo formato exibido em tela) a partir
  dos dados FILTRADOS na hora (busca/filtro aplicado, não a lista inteira).
  - "Imprimir" → printer.imprimirLista(doc), mesmo mecanismo do comprovante
    e mesma preferência térmica/A4. Templates em services/templateLista.ts.
    Térmica 80mm não cabe uma tabela de várias colunas — vira uma "ficha"
    por registro (1ª coluna como título, demais como rótulo: valor). A4 é
    uma tabela normal, em paisagem.
  - "Gerar PDF" → pdf.service.ts (gerarPdfLista), baixa o .pdf direto sem
    diálogo — só assim os dois botões fazem coisas de fato diferentes.
    Usa jsPDF + jspdf-autotable, sempre A4 paisagem (formato de papel não
    faz sentido pra um arquivo digital). ATENÇÃO: jsPDF traz o plugin de
    `.html()` (html2canvas + dompurify) sempre junto no bundle mesmo sem
    usar esse recurso — mediu ~380KB gzip a mais no build. Se o tamanho do
    PWA virar problema, vale trocar por uma lib mais enxuta (ex.: pdfmake)
    ou gerar o PDF via impressão (usuário escolhe "Salvar como PDF" no
    diálogo do navegador) em vez de biblioteca dedicada.
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
- Monitor de custo de aquisição de peças (MonitorCustoAquisicao, logo
  abaixo do de faturamento, mesmo cartão por empresa): soma
  quantidade × custo_unit das movimentacao_estoque tipo='entrada' do ano
  corrente (por created_at), comparado com o MESMO limite_anual_mei. É
  alerta ANTECIPADO, não uma regra nova — venda = custo + margem, então o
  faturamento (o que de fato conta pro limite do MEI) é sempre maior que o
  custo de aquisição sozinho; se o custo já está perto do limite, o
  faturamento vai estourar ainda mais rápido assim que essas peças forem
  vendidas. Só soma movimentações com empresa_id preenchido — entradas
  registradas antes da feature de empresa em estoque (ver
  supabase/migrations/estoque_empresa.sql) ficam de fora, não dá pra saber
  de qual CNPJ era a nota. Também só aparece pra regime='MEI' (igual ao
  monitor de faturamento — pra ME o limite anual não se aplica mais).

### Cadastros (feature já pronta em src/features/cadastros)

- Cliente e fornecedor com endereço completo separado em campos.
- Busca automática por CEP via ViaCEP.
- Obrigatoriedade: nome+telefone sempre; endereço completo só quando PJ ou
  quando exigirNota=true.
- Na navegação (App.tsx), "Cadastros" é uma aba PAI (src/pages/
  CadastrosPage.tsx) que agrupa Empresas/Clientes/Fornecedores/Categorias/
  Contas Financeiras numa sub-navegação interna (pg-subnav, mesma pílula
  visual da nav principal mas em contexto claro) — existe só pra não lotar
  o menu principal de abas; cada sub-página continua sendo o componente de
  sempre (EmpresasPage, ClientesPage, FornecedoresPage, CategoriasPage,
  ContasFinanceirasPage), sem mudança de lógica interna nelas.

### Autenticação e perfis (feature já pronta em src/features/auth)

- Login OBRIGATÓRIO pro app inteiro (App.tsx só renderiza a aplicação se
  tiver sessão do Supabase Auth ativa; sem sessão, mostra LoginPage — sem
  cadastro/self-signup na tela, só e-mail+senha). AuthProvider
  (src/features/auth/hooks/useAuth.tsx) envolve o app inteiro em
  main.tsx, guarda a sessão (`supabase.auth.getSession` +
  `onAuthStateChange`) e o perfil (papel) do usuário logado.
- 2 papéis: `admin` e `operador` (tabela `perfis`, 1 linha por usuário do
  Supabase Auth, `papel` check constraint). Ao criar um usuário no painel
  do Supabase, um TRIGGER (`criar_perfil_novo_usuario`, em
  auth_perfis_rls.sql) cria o perfil automaticamente com papel='operador'
  — nasce sempre operador por segurança; promover a admin é manual via
  SQL (update direto em `perfis`, ver instruções de setup dadas ao
  usuário), nunca por uma tela do app.
- RLS deixou de ser provisório: as policies antigas
  "acesso_total_provisorio" (anon+authenticated, using(true) geral) foram
  substituídas por "acesso_logados" (só `authenticated`) em todas as
  tabelas do app. Helper `is_admin()` (security definer, checa
  perfis.papel='admin' e ativo=true pro auth.uid() atual) fica disponível
  pra policies que precisarem de trava extra de admin.
- Único caso com trava de admin hoje: AJUSTE MANUAL de estoque (botão
  "Ajustar" em MovimentacoesDaPeca, ver seção Estoque). A trava é uma
  ÚNICA policy com WITH CHECK combinado
  (`origem is distinct from 'ajuste_manual' or is_admin()`) em vez de
  duas policies separadas — policies permissivas do Postgres se somam
  com OR, então uma policy "geral" + uma "só admin" não restringiria
  nada. IMPORTANTE: a trava é por `origem = 'ajuste_manual'`, NÃO por
  `tipo = 'ajuste'` — devolução ao fornecedor
  (devolucao_fornecedor_defeito/nfe_cancelada) também usa
  `tipo: 'ajuste'` no banco mas é uma origem diferente e continua aberta
  pra qualquer usuário logado (não é a mesma situação de risco: tem
  motivo/fornecedor obrigatórios, não é "digitar qualquer número").
- UI: o botão "Ajustar" fica sempre VISÍVEL (não escondido) mas
  `disabled` pra quem não é admin (`useAuth().ehAdmin`), com
  `title="Essa função requer perfil de administrador"` no hover — é
  só UX, a trava de verdade é a policy do banco (RLS), não o
  `disabled` do botão (que dá pra burlar batendo direto na API).
- Cabeçalho do app mostra nome/e-mail + badge do papel do usuário logado
  e um botão de sair (`supabase.auth.signOut()`), ao lado do
  toggle de tema/formato de impressão.
- Escopo CONSCIENTE: por enquanto só o ajuste manual de estoque é
  admin-only. Excluir/Estornar em Financeiro continuam abertos pra
  qualquer usuário logado (`authenticated`) — não foi pedido restringir
  isso ainda; se pedirem, é o mesmo padrão (origem/campo discriminador +
  `is_admin()` no WITH CHECK).

### Diálogos de confirmação e aviso (src/shared — usado em todo o app)

- `useConfirmacao()` (src/shared/hooks/useConfirmacao.tsx, provider
  `ConfirmacaoProvider` em main.tsx, dentro do AuthProvider) substitui
  `window.confirm`/`window.alert` — que são feios, não dá pra formatar em
  parágrafos, e não seguem o tema claro/escuro do app. Expõe:
  - `confirmar({ titulo, mensagem, tom?, textoConfirmar?, textoCancelar? })`
    → `Promise<boolean>`. `mensagem` aceita string OU array de strings
    (cada item vira um parágrafo — usado pra explicar o impacto em
    passos, tipo "o que vai acontecer" + "como reverter" + "atenção").
  - `avisar({ titulo, mensagem, tom? })` → `Promise<void>`, resolve
    quando o usuário clica "Entendi". Pra mensagens de bloqueio (ação
    recusada porque o registro tá vinculado a outra coisa).
  - `tom`: 'perigo' (vermelho, default de `confirmar` — ação
    destrutiva/irreversível), 'aviso' (âmbar, default de `avisar` —
    reversível ou só heads-up), 'info' (azul, pouco usado ainda).
  - Renderizado por `ConfirmDialog.tsx` — só 1 diálogo por vez; chamadas
    empilham naturalmente porque quem chama usa `await`.
- REGRA DE CONTEÚDO das mensagens (pedido explícito do usuário: "seja
  didático, dê o máximo de instruções possíveis pro usuário não cometer
  erros sem saber"): toda ação crítica explica O QUE vai mudar de verdade
  (não só "tem certeza?"), e toda ação BLOQUEADA por vínculo com outro
  registro diz ONDE exatamente está o vínculo (nunca um genérico "não foi
  possível") — ex.: "Esta despesa já gerou contas em Financeiro" em vez
  de "erro ao excluir". Aplicado em: ajuste manual de estoque, devolução
  ao fornecedor, excluir/estornar lançamento financeiro (mensagem de
  estorno é dinâmica — muda conforme o lançamento já estava pago e/ou
  vinculado a OS/venda), devolver item de OS/venda faturada, desativar/
  excluir peça, despesa recorrente, categoria e veículo. Excluir veículo
  não tinha NENHUM tratamento de erro antes disso (FK de `ordens_servico`
  vinha crua, sem try/catch) — corrigido junto, reaproveitando o mesmo
  helper `ehViolacaoDeReferencia` (agora em `src/shared/utils/erros.ts`,
  reexportado por `despesas.service.ts` por compatibilidade — é um
  helper genérico de erro do Postgres/Supabase, código '23503', não é
  algo específico de despesas).
- Os 2 avisos de projeção financeira que já existiam (conta a pagar
  zerando o resultado do mês; pagamento negativando o saldo de caixa —
  ver "NÃO existe trava impedindo despesa > receita" em Financeiro)
  também migraram pra `confirmar()`, só pela consistência visual — a
  lógica de quando avisar continua a mesma.

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
   - ✅ Impressão (Fase 1: comprovante térmica 80mm + A4/Carta, preferência
     global) — pronta, ligada na OS e na Venda de balcão. Listas (Clientes,
     Estoque, Financeiro etc.) têm Imprimir + Gerar PDF próprios
     (BotoesImpressaoLista), com a logo (sem fundo, ver seção Identidade
     visual) no cabeçalho do PDF e da impressão A4/Carta — térmica 80mm
     não leva logo, de propósito (bobina estreita).
   - ✅ Estorno de OS/venda faturada, exclusão de lançamento pendente, e
     devolução de item (peça física volta ao estoque, ou serviço) de uma
     OS/venda já faturada — tudo implementado (ver "Estorno e exclusão de
     lançamento" em Financeiro).
   - ✅ Autenticação + RLS de verdade (feature src/features/auth,
     supabase/migrations/auth_perfis_rls.sql) — substituiu a fase
     provisória (anon+authenticated liberado, `rls_policies.sql`/
     `rls_categorias_nfe.sql`) que só existia porque não tinha login.
     Ver seção "Autenticação e perfis" abaixo.
8. Fases futuras (fora do MVP):
   - ✅ Importação XML NF-e (entrada de estoque) — feature já pronta em
     src/features/importacao-nfe.
   - ✅ Contas Financeiras (banco/carteira/cartão/investimento) — feature já
     pronta em src/features/contas-financeiras, obrigatória em todo
     lançamento pago/recebido (ver seção Financeiro).
   - Saldo por conta financeira no Fluxo de Caixa — a coluna
     `financeiro.conta_financeira_id` já existe e é preenchida em todo
     lançamento quitado, só falta a tela (FluxoCaixaPage) agregar/filtrar
     por ela (hoje agrega só por empresa).
   - Sincronizar filtros de tela (busca, status, período, empresa
     selecionada) com a URL — Financeiro, Fluxo de Caixa, OS, Estoque,
     Cadastros. Hoje é só `useState` local; ficou de fora de uma rodada de
     revisão de Web Interface Guidelines por ser mudança na navegação
     principal do app, não um bug pontual.
   - Virtualização de listas grandes (Estoque, Financeiro, OS, Vendas) —
     mesma revisão acima, adiada por exigir escolher uma lib nova.
   - Impressão ESC/POS.
   - Emissão fiscal (NFC-e/NFS-e via PlugNotas/Focus/eNotas).
