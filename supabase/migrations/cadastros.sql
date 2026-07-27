-- =============================================================================
-- CADASTROS: CLIENTES E FORNECEDORES (com endereço completo)
-- =============================================================================
-- Estrutura pensada para:
--   • Cadastro rápido no balcão (só nome + telefone obrigatórios)
--   • Endereço separado em campos (exigência de nota fiscal — Fase 3)
--   • tipo_pessoa PF/PJ no cliente (importa desde o MEI: venda p/ PJ exige nota)
--   • Preenchimento de fornecedor via XML da NF-e no futuro (bloco enderEmit)
--   • Busca automática por CEP (ViaCEP) preenchendo logradouro/bairro/cidade/uf
-- =============================================================================

-- ---------------------------------------------------------------------------
-- CLIENTES
-- ---------------------------------------------------------------------------
create table if not exists clientes (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  tipo_pessoa  text not null default 'PF' check (tipo_pessoa in ('PF','PJ')),
  documento    text,                       -- CPF (PF) ou CNPJ (PJ)
  telefone     text,
  email        text,

  -- Endereço (componentes padrão BR — batem com o que a nota fiscal exige)
  cep          text,
  logradouro   text,                       -- rua / avenida
  numero       text,
  complemento  text,
  bairro       text,
  cidade       text,
  uf           char(2),                     -- 'CE', 'PE'...

  observacoes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Índices úteis para busca no balcão
create index if not exists idx_clientes_nome     on clientes (lower(nome));
create index if not exists idx_clientes_documento on clientes (documento);
create index if not exists idx_clientes_telefone  on clientes (telefone);

-- ---------------------------------------------------------------------------
-- FORNECEDORES
-- ---------------------------------------------------------------------------
create table if not exists fornecedores (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,              -- razão social / nome fantasia
  cnpj         text,
  telefone     text,
  email        text,

  -- Endereço (pode ser preenchido automaticamente pelo XML da NF-e de entrada)
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

create index if not exists idx_fornecedores_nome on fornecedores (lower(nome));
create index if not exists idx_fornecedores_cnpj on fornecedores (cnpj);

-- ---------------------------------------------------------------------------
-- Gatilho para manter updated_at em dia (opcional, recomendado)
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_clientes_updated on clientes;
create trigger trg_clientes_updated
  before update on clientes
  for each row execute function set_updated_at();

drop trigger if exists trg_fornecedores_updated on fornecedores;
create trigger trg_fornecedores_updated
  before update on fornecedores
  for each row execute function set_updated_at();

-- =============================================================================
-- NOTAS SOBRE OBRIGATORIEDADE (aplicada na camada da aplicação, não no banco):
--   • Sempre exigido:   nome, telefone
--   • Recomendado:      documento, cidade, uf
--   • Endereço completo: exigir quando tipo_pessoa = 'PJ' OU quando for emitir
--                        nota (Fase 3 / ME). No MEI + PF no balcão, deixar
--                        opcional para não travar a venda rápida.
-- Mantido flexível no banco (poucos NOT NULL) de propósito, para o balcão.
-- =============================================================================
