-- =============================================================================
-- CONTAS FINANCEIRAS GANHAM EMPRESA (opcional)
-- =============================================================================
-- Cada conta (banco/carteira/cartão/investimento) pode ser vinculada a uma
-- empresa específica — uma conta bancária normalmente pertence a um CNPJ só.
-- Nullable de propósito: uma conta sem empresa definida é tratada como
-- COMPARTILHADA (aparece pra escolher em qualquer empresa) — útil pra
-- "Carteira" (dinheiro em espécie da loja física), que não pertence a um
-- CNPJ específico. Ver listarContasFinanceiras (filtro
-- empresa_id = X OU empresa_id IS NULL) em contasFinanceiras.service.ts.
-- =============================================================================

alter table contas_financeiras add column if not exists empresa_id uuid references empresa_config(id);
