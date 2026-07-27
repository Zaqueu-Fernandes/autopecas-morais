-- =============================================================================
-- MÚLTIPLAS EMPRESAS — separa o faturamento por CNPJ/empresa
-- =============================================================================
-- empresa_config passa a admitir várias linhas (deixa de ser singleton).
-- financeiro e despesas_fixas ganham empresa_id: cada lançamento/despesa
-- pertence a uma empresa, pra dar pra monitorar o limite do MEI de cada
-- CNPJ separadamente. Clientes, veículos, estoque e OS continuam
-- compartilhados (é a mesma oficina física) — só o financeiro é dividido.
-- =============================================================================

alter table empresa_config add column if not exists cnpj text;

alter table financeiro      add column if not exists empresa_id uuid references empresa_config(id);
alter table despesas_fixas  add column if not exists empresa_id uuid references empresa_config(id);

-- Backfill: se já existir alguma empresa cadastrada (era o caso de uso
-- singleton, anterior a esta feature), associa a ela os lançamentos/despesas
-- que ainda não tinham empresa.
do $$
declare
  primeira_empresa uuid;
begin
  select id into primeira_empresa from empresa_config order by created_at limit 1;
  if primeira_empresa is not null then
    update financeiro     set empresa_id = primeira_empresa where empresa_id is null;
    update despesas_fixas set empresa_id = primeira_empresa where empresa_id is null;
  end if;
end $$;

create index if not exists idx_financeiro_empresa      on financeiro (empresa_id);
create index if not exists idx_despesas_fixas_empresa  on despesas_fixas (empresa_id);
