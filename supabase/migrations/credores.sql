-- ============================================================================
-- CREDORES
-- ============================================================================
-- Cadastro genérico de "pra quem uma despesa é paga" quando a categoria NÃO
-- é 'fornecedor' (que já tem seu próprio cadastro/select) — ex.: categoria
-- 'despesa_geral' com credor "Empresa de Energia Elétrica", ou
-- 'retirada_lucro' com credor sendo o nome da pessoa física que recebe.
-- Campo OPCIONAL nos lançamentos (financeiro/despesas_fixas) — decisão do
-- usuário, pra não forçar escolha em toda despesa genérica rápida.
--
-- Mesmo formato de fornecedores (nome + endereço completo opcional), só que
-- `documento` é genérico (CPF ou CNPJ) em vez de `cnpj` fixo, já que credor
-- pode ser pessoa física.

create table if not exists credores (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  documento    text,
  telefone     text,
  email        text,
  cep          text,
  logradouro   text,
  numero       text,
  complemento  text,
  bairro       text,
  cidade       text,
  uf           char(2),
  observacoes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_credores_nome on credores (lower(nome));

drop trigger if exists trg_credores_updated on credores;
create trigger trg_credores_updated
  before update on credores
  for each row execute function set_updated_at();

alter table credores enable row level security;
drop policy if exists "acesso_logados" on credores;
create policy "acesso_logados" on credores for all to authenticated using (true) with check (true);

-- Vínculo opcional em financeiro/despesas_fixas — mesmo padrão de fornecedor_id.
alter table financeiro     add column if not exists credor_id uuid references credores(id);
alter table despesas_fixas add column if not exists credor_id uuid references credores(id);
