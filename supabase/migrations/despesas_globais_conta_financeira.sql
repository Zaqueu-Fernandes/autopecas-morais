-- =============================================================================
-- DESPESAS RECORRENTES VIRAM GLOBAIS + CONTAS FINANCEIRAS (banco/carteira/
-- cartão/investimento) nos lançamentos
-- =============================================================================
-- 1) despesas_fixas deixa de ter empresa_id: é só um MOLDE recorrente
--    (aluguel, internet...), quem paga de fato pode variar mês a mês entre
--    as empresas do usuário. A conta gerada em financeiro nasce com
--    empresa_id = NULL (pendente, "Empresa a Definir" na UI) e só recebe a
--    empresa de verdade no momento de "Quitar" (aplicação decide, não banco).
--    Todos os OUTROS jeitos de lançar (conta a pagar manual, faturar OS,
--    finalizar venda) continuam exigindo empresa na criação — então
--    financeiro.empresa_id null só acontece nesse caso específico daqui pra
--    frente. Dado histórico de despesas_fixas.empresa_id é descartado de
--    propósito (deixou de fazer sentido pro molde recorrente).
-- =============================================================================

alter table despesas_fixas drop column if exists empresa_id;

-- =============================================================================
-- 2) contas_financeiras — cadastro do usuário (Cadastros > Contas
--    Financeiras). Cada lançamento quitado (pago ou recebido) passa a
--    exigir qual conta/carteira/maquineta movimentou o dinheiro, além da
--    forma de pagamento (que já existia). Sem empresa_id de propósito — o
--    usuário não pediu esse vínculo aqui (uma conta pode ser usada por
--    qualquer uma das empresas da mesma oficina).
-- =============================================================================

create table if not exists contas_financeiras (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('banco', 'carteira', 'cartao', 'investimento')),
  instituicao text not null, -- nome do banco/instituição, ou uma label livre (ex.: "Caixa da loja")
  ativo       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_contas_financeiras_updated on contas_financeiras;
create trigger trg_contas_financeiras_updated
  before update on contas_financeiras
  for each row execute function set_updated_at();

alter table contas_financeiras enable row level security;
drop policy if exists "acesso_logados" on contas_financeiras;
create policy "acesso_logados" on contas_financeiras for all to authenticated using (true) with check (true);

-- =============================================================================
-- 3) financeiro.conta_financeira_id — qual conta recebeu/pagou. Nullable:
--    lançamentos antigos não têm (histórico não é reescrito), e um
--    lançamento pendente também não tem ainda (só é exigido no momento de
--    quitar/faturar à vista/finalizar à vista — validado na aplicação).
-- =============================================================================

alter table financeiro add column if not exists conta_financeira_id uuid references contas_financeiras(id);
