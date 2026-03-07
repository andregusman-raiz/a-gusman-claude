# Playbook 01: Spec Driven Development (SDD)

> Principio 80/20: 80% planejamento, 20% execucao.

## Filosofia

Especificacao detalhada ANTES de escrever codigo. Reduz retrabalho, melhora qualidade, e permite execucao autonoma por IA.

## Fluxo

```
Fase 1: PRD → Fase 2: Cleanup → Fase 3: SPEC → Fase 4: Execucao → Fase 5: Review
```

## Fase 1: PRD (Product Requirements Document)

Definir ANTES de qualquer codigo:
- **Problema**: Qual problema estamos resolvendo?
- **Escopo**: O que esta dentro e fora?
- **Requisitos**: Funcionais e nao-funcionais
- **Criterios de Sucesso**: Como saber se deu certo?
- **Restricoes**: Prazo, tecnologia, compatibilidade

## Fase 2: Context Cleanup

1. Salvar PRD em arquivo
2. Limpar contexto se necessario (nova sessao)
3. Carregar apenas PRD + contexto relevante

## Fase 3: SPEC (Especificacao Tecnica)

### Regras
- **Maximo 200 linhas** por SPEC
- Se maior → dividir em SPEC_1.md, SPEC_2.md
- Incluir: interface, dados, fluxos, edge cases, dependencias
- Usar Ralph Loop (max 3 iteracoes de refinamento)

### Template SPEC

```markdown
# SPEC: [Nome]
## Objetivo: [Uma frase]
## Interface: [Inputs, Outputs, Comportamento]
## Estrutura de Dados: [Schemas, tabelas]
## Fluxos: [Happy path, Error paths]
## Edge Cases: [Lista]
## Dependencias: [Modulos, APIs, libs]
## Criterios de Aceite: [Checklist]
```

## Fase 4: Execucao

1. Decompor SPEC em tarefas atomicas (skill planejar)
2. Implementar tarefa por tarefa (skill construir)
3. Verificar checkpoints intermediarios
4. A cada 10 acoes: reler SPEC (prevenir drift)

## Fase 5: Review

1. Validar todos os criterios de aceite
2. Rodar testes
3. Code review (skill revisar)
4. Documentar decisoes tomadas

## Quando NAO Usar SDD

| Cenario | Alternativa |
|---------|-------------|
| Hotfix urgente | Fix direto, documentar depois |
| Tarefa trivial (< 30 min) | Quick task workflow |
| Exploracao/pesquisa | Skill explorar |
