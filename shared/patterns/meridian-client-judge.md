# Meridian Client Judge — D5-FEELS Rubric

## Proposito

Avaliar software do ponto de vista de um CLIENTE PAGANTE que ve a aplicacao pela primeira vez.
Nao e teste tecnico — e avaliacao de produto.

## 6 Criterios de Avaliacao

### 1. Primeira Impressao (15%)

| Score | Criterio |
|-------|----------|
| 9-10 | Dashboard carrega em < 2s com dados reais, visual profissional, hierarquia clara |
| 7-8 | Carrega em < 3s, visual bom, dados presentes mas sem destaque |
| 5-6 | Carrega em < 5s, visual aceitavel, alguns dados faltando |
| 3-4 | Demora > 5s, visual generico, dados parciais ou placeholder |
| 1-2 | Tela em branco, loading infinito, visual amador, ou sem dados |

### 2. Credibilidade dos Dados (20%)

| Score | Criterio |
|-------|----------|
| 9-10 | Numeros plausíveis, totais batem, datas atuais, graficos coerentes |
| 7-8 | Dados fazem sentido, pequenas inconsistencias (datas antigas em historico) |
| 5-6 | Alguns dados parecem mock (nomes genericos), mas numeros sao plausíveis |
| 3-4 | Mistura de dados reais e mock, totais nao batem, datas erradas |
| 1-2 | "Lorem ipsum", "John Doe", zeros em tudo, ou dados completamente vazios |

**Red flags automaticos (score max 4)**:
- "Lorem ipsum" em qualquer lugar
- "John Doe", "Jane Smith", "test@test.com"
- Todos os valores sao 0 ou iguais
- Datas no futuro distante ou > 2 anos no passado (exceto historico)

### 3. Completude de Features (20%)

| Score | Criterio |
|-------|----------|
| 9-10 | 3/3 workflows principais completaveis end-to-end sem bloqueio |
| 7-8 | 3/3 workflows completaveis com minor friction (tooltip confuso, step extra) |
| 5-6 | 2/3 workflows completaveis, 1 quebra no meio |
| 3-4 | 1/3 workflows completaveis, 2 quebram |
| 1-2 | Nenhum workflow completavel end-to-end |

**Como selecionar os 3 workflows**:
- Identificar as 3 acoes mais comuns do tipo de app
- Dashboard: visualizar dados, filtrar, exportar
- CRUD: criar item, editar, deletar
- Admin: configurar, gerenciar usuarios, alterar settings

### 4. Tratamento de Erros (15%)

| Score | Criterio |
|-------|----------|
| 9-10 | Empty states informativos, validacao inline, error boundaries, 404 page |
| 7-8 | Maioria dos empty states presentes, validacao funcional |
| 5-6 | Alguns empty states, validacao basica (required), sem 404 page |
| 3-4 | Listas vazias sem mensagem, forms sem validacao, erros genericos |
| 1-2 | Tela em branco ao falhar, sem feedback de erro, crash sem recovery |

### 5. Polimento Visual (15%)

| Score | Criterio |
|-------|----------|
| 9-10 | Design system consistente, spacing uniforme, tipografia hierarquica, cores harmoniosas |
| 7-8 | Visual coerente com pequenas inconsistencias (padding diferente em 1-2 lugares) |
| 5-6 | Mistura de estilos, spacing irregular, mas funcional e legivel |
| 3-4 | Sem design system aparente, cores inconsistentes, layout desalinhado |
| 1-2 | Visual amador, elementos sobrepostos, ilegivel em algum viewport |

### 6. Fluxo de Navegacao (15%)

| Score | Criterio |
|-------|----------|
| 9-10 | Menu intuitivo, breadcrumbs, features encontraveis em < 2 cliques |
| 7-8 | Menu organizado, maioria das features encontraveis facilmente |
| 5-6 | Menu funcional mas confuso, algumas features escondidas |
| 3-4 | Navegacao confusa, links quebrados, features dificeis de encontrar |
| 1-2 | Sem navegacao clara, links mortos, impossivel descobrir features |

## Calculo Final

```
D5_FEELS = (
  primeira_impressao * 0.15 +
  credibilidade_dados * 0.20 +
  completude_features * 0.20 +
  tratamento_erros * 0.15 +
  polimento_visual * 0.15 +
  fluxo_navegacao * 0.15
) * 10
```

## Narrativa Obrigatoria

Apos scoring, escrever 3-5 frases na perspectiva de cliente:

> "Como cliente avaliando este software para [uso pretendido], eu [aceitaria/hesitaria/rejeitaria]
> este produto porque [razoes concretas com exemplos]. Os pontos fortes sao [X]. Os pontos que
> me preocupam sao [Y]. Para eu aprovar, seria necessario [Z]."

Esta narrativa e o artefato mais valioso do MERIDIAN — e o que nenhum teste tecnico captura.
