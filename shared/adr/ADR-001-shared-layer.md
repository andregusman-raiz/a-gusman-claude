# ADR-001: Arquitetura de 3 Camadas para Gestao de Conhecimento

**Data:** 2026-03-08
**Status:** Aceito
**Contexto:** Projetos raiz-platform e rAIz-AI-Prof duplicavam agents, playbooks, hooks, rules e patterns independentemente, causando divergencia silenciosa e desperdicio.

## Decisao

Adotar arquitetura de 3 camadas:
1. **Workspace** (`.claude/`): Agents, hooks, rules, playbooks — universais
2. **Shared** (`.shared/`): Templates e patterns reutilizaveis — copiados ou referenciados
3. **Project** (`GitHub/<proj>/`): CLAUDE.md, skills, overrides — especificos

## Consequencias

### Positivas
- Best practices definidas uma vez, usadas por todos
- Divergencia detectavel via `diff` entre template e projeto
- Sync automatico via hook PostToolUse
- Novos projetos iniciam com templates maduros

### Negativas
- Mais uma camada para manter
- Templates podem divergir se sync nao for executado
- Projetos com necessidades muito diferentes podem nao se beneficiar

### Riscos Mitigados
- sync.sh NUNCA sobrescreve customizacoes locais (so copia se destino nao existe)
- Patterns sao referencia (nao copiados) — sempre atualizados
