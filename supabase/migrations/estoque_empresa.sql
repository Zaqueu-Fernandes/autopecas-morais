-- =============================================================================
-- ESTOQUE × EMPRESA — CNPJ da nota de entrada (só controle, não divide saldo)
-- =============================================================================
-- movimentacao_estoque ganha empresa_id: o fornecedor emite a NF-e pra um dos
-- CNPJs cadastrados em empresa_config, e a aplicação passa a pedir qual
-- empresa recebeu a nota ao registrar uma ENTRADA (manual, importação de XML
-- de NF-e ou estoque inicial da peça nova).
--
-- Coluna fica NULLABLE no banco porque só 'entrada' preenche (saída/ajuste
-- não têm CNPJ de nota) — a obrigatoriedade em entradas novas é validada na
-- aplicação (ver validarEntrada/validarPeca em estoque/types.ts), não aqui.
--
-- Isso NÃO reintroduz separação de estoque por empresa: pecas.qtd continua
-- sendo o saldo somado do razão inteiro, compartilhado entre as empresas —
-- é a mesma oficina física (ver CLAUDE.md). empresa_id aqui é só rastreio de
-- qual CNPJ pagou aquele lote, pra controle/auditoria.
-- =============================================================================

alter table movimentacao_estoque
  add column if not exists empresa_id uuid references empresa_config(id);

create index if not exists idx_movimentacao_empresa on movimentacao_estoque (empresa_id);
