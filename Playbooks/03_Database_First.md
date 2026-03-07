# Playbook 03: Database First

> "O banco deve ser desenhado e aprovado ANTES de qualquer linha de codigo."

## Filosofia

O banco de dados e o alicerce. Erros de design de banco sao os mais caros de corrigir.

## Fluxo

```
Requisitos → Diagrama → Aprovacao → Schema → Migrations → APIs → Frontend
```

## Regras de Ouro

1. **Normalize primeiro** — desnormalize depois (por performance)
2. **UUIDs como PK** — nao usar serial/incremental
3. **Timestamps obrigatorios** — `created_at`, `updated_at` em toda tabela
4. **Soft delete quando apropriado** — `deleted_at` ao inves de DELETE fisico
5. **Enums como CHECK constraints** — para enums simples

## Template de Tabela

```sql
CREATE TABLE public.nome_tabela (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nome_tabela_user_id ON public.nome_tabela(user_id);

ALTER TABLE public.nome_tabela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nome_tabela_select" ON public.nome_tabela
  FOR SELECT USING (auth.uid() = user_id);
```

## Validacao Antes de Criar Migration

- [ ] Todas as entidades representadas
- [ ] Relacionamentos corretos (1:1, 1:N, N:N)
- [ ] Indices para queries frequentes
- [ ] RLS em todas as tabelas
- [ ] Constraints de integridade
- [ ] Audit trail para tabelas criticas

## Anti-Patterns

| Anti-Pattern | Solucao |
|-------------|---------|
| Design no frontend (schema reflete UI) | Pensar em entidades de negocio |
| Tabela "god object" (50+ colunas) | Normalizar em entidades menores |
| Sem indices | Indices desde o inicio |
| RLS esquecido | Incluir na mesma migration |
| Migration manual | Sempre via arquivo de migration |
