# QAT Scenario Design — Metodologia User Story → QAT Scenario

## Principio Fundamental

> Todo cenario QAT simula um USUARIO REAL usando o PRODUTO FINAL.
> Se o cenario nao tem persona, contexto e objetivo de negocio, nao e QAT — e screenshot automatizado.

---

## Framework: User Story → QAT Scenario

### Estrutura obrigatoria

```
DADO [quem e o usuario, o que ja fez, que dados tem no sistema]
QUANDO [acao especifica que o usuario quer realizar]
ENTAO [resultado que o produto deve entregar]
E [criterios de qualidade: como saber se o resultado e BOM]
```

### Exemplo RUIM vs BOM

**RUIM (cenario raso):**
```
Navigate → fill "Quais vantagens da IA?" → wait → screenshot → judge
```
- Input generico (qualquer usuario faria essa pergunta?)
- Sem contexto (quem pergunta? para que?)
- Sem criterio de negocio (o que faz a resposta ser BOA para esse usuario?)

**BOM (cenario real):**
```
DADO: Coordenadora pedagogica, escola publica, 3o ano fundamental
      Ja tem plano curricular semestral carregado no sistema
QUANDO: Pede "Sugira 3 atividades de alfabetizacao para alunos
        do 3o ano que ainda nao dominam leitura fluente,
        alinhadas ao meu plano curricular"
ENTAO: Resposta deve conter:
  - 3 atividades DISTINTAS (nao variacoes da mesma)
  - Cada atividade com: objetivo, materiais, duracao, adaptacao
  - Referencia ao plano curricular carregado (nao generico)
  - Linguagem acessivel para educador (nao academica)
E: Criterios de qualidade:
  - Aplicabilidade: professor pode usar amanha sem adaptar muito
  - Adequacao: atividades para nivel pre-fluente (nao avancado)
  - Diferenciacao: cada atividade usa abordagem diferente
  - Contextualizacao: referencia ao plano curricular do usuario
```

---

## Anatomia de um Cenario QAT v2

### Arquivos por cenario

```
scenarios/
└── qat-01-chat-educacional/
    ├── context.md              # Persona + pre-condicoes + dados necessarios
    ├── journey.spec.ts         # Jornada completa (4 camadas)
    ├── rubric.ts               # Rubrica ESPECIFICA para este cenario
    ├── golden-sample.md        # Output ideal (referencia para o judge)
    └── anti-patterns.md        # Outputs que DEVEM falhar
```

Para cenarios simples, tudo pode estar no `.spec.ts` com comentarios estruturados.
Para cenarios complexos, separar em arquivos facilita manutencao e reuso.

---

## 4 Camadas de Validacao

Cada cenario implementa 4 camadas em ordem. Se uma camada falha, as seguintes NAO executam.

| Camada | Valida | Como | Quando falha |
|--------|--------|------|--------------|
| **L1: Smoke** | Pagina carrega, elementos existem | `expect(element).toBeVisible()` | Infra quebrada |
| **L2: Functional** | Acao produz resultado (nao vazio, tipo correto) | Assertions programaticas | Feature quebrada |
| **L3: Quality** | Resultado e BOM (AI-as-Judge) | Claude avalia com rubrica | Qualidade degradou |
| **L4: Business** | Resultado atende objetivo do usuario | Criterios de aceitacao | Produto nao serve |

### Implementacao das camadas

```typescript
test('QAT-01: chat educacional', async ({ page, evaluateOutput }) => {
  // === L1: SMOKE ===
  await page.goto(`${baseUrl}/dashboard`);
  await expect(page.getByRole('textbox')).toBeVisible({ timeout: 10_000 });
  // Se textbox nao aparece → test falha aqui (infra/feature quebrada)

  // === L2: FUNCTIONAL ===
  await page.getByRole('textbox').fill(userPrompt);
  await page.getByRole('textbox').press('Enter');
  await waitForOutputStable(page, OUTPUT_SELECTOR, timeoutMs);

  const outputText = await page.locator(OUTPUT_SELECTOR).textContent();
  expect(outputText).toBeTruthy();  // Output existe
  expect(outputText!.length).toBeGreaterThan(100);  // Nao e stub
  // Se output vazio ou stub → test falha aqui (feature quebrada)

  // === L3: QUALITY (AI-as-Judge) ===
  const evaluation = await evaluateOutput(SCENARIO, outputText!);
  expect(evaluation.overallScore).toBeGreaterThanOrEqual(PASS_THRESHOLD);
  // Se score < threshold → qualidade degradou

  // === L4: BUSINESS (criterios especificos) ===
  // Verificacoes programaticas que o judge nao consegue fazer:
  const hasActivities = (outputText!.match(/atividade|ação|proposta/gi) || []).length >= 3;
  expect(hasActivities).toBe(true);  // Minimo 3 atividades distintas

  const mentionsCurriculum = /plano|curricular|BNCC/i.test(outputText!);
  expect(mentionsCurriculum).toBe(true);  // Referencia ao contexto do usuario
});
```

### Regras de short-circuit
- L1 falha → classificar como INFRA, custo $0 (sem API call)
- L2 falha → classificar como FEATURE, custo $0
- L3 falha → classificar como QUALITY, custo ~$0.03 (1 API call)
- L4 falha → classificar como BUSINESS, custo ~$0.03

---

## Tipos de Cenario

| Tipo | Objetivo | Frequencia | Exemplo |
|------|----------|------------|---------|
| **Core Journey** | Fluxo principal do dia-a-dia | Toda run | Chat → resposta → export |
| **Quality Gate** | Padrao minimo de output | Toda run | Relatorio tem N secoes |
| **Regression** | Detectar que algo parou | Toda run | Score caiu >1.5 vs baseline |
| **Edge Case** | Inputs dificeis/ambiguos | Semanal | Pergunta em Spanglish |
| **Comparative** | Comparar versoes/modelos | Manual | Sonnet vs Haiku no mesmo prompt |

---

## Checklist de Qualidade para Novos Cenarios

Antes de adicionar um cenario QAT:

### Obrigatorio (BLOCKING)
- [ ] Persona definida? (quem e o usuario, qual o papel)
- [ ] Input realista? (reflete uso real, nao prompt generico de demo)
- [ ] Pre-condicoes claras? (dados carregados, config, auth state)
- [ ] Setup automatizado? (cenario prepara ambiente, nao assume estado)
- [ ] 4 camadas implementadas? (L1 → L2 → L3 → L4)
- [ ] Sem silent failures? (zero `.catch(() => false)`, zero `if` sem `else`)
- [ ] Rubrica especifica? (criterios deste cenario, nao genericos)

### Recomendado
- [ ] Golden sample existe? (output ideal para calibrar judge)
- [ ] Anti-patterns definidos? (outputs que DEVEM falhar)
- [ ] Criterio de negocio? (o que o usuario PRECISA do resultado)
- [ ] Timeout adequado? (baseado em observacao real, nao chute)

---

## Como definir a Persona

### Template

```markdown
## Persona: [Nome do Papel]

**Quem**: [Cargo/funcao na organizacao]
**Contexto**: [Tipo de escola/empresa, tamanho, regiao]
**Objetivo**: [O que quer alcanzar com o produto]
**Frequencia**: [Quantas vezes por dia/semana usa essa feature]
**Nivel tecnico**: [Basico/Intermediario/Avancado]
**Dados no sistema**: [Documentos carregados, historico, config]
```

### Exemplo

```markdown
## Persona: Coordenadora Pedagogica

**Quem**: Coordenadora pedagogica de escola publica municipal
**Contexto**: Escola em Sao Paulo, 800 alunos, 3o ao 9o ano
**Objetivo**: Criar planos de aula alinhados a BNCC para seus professores
**Frequencia**: 3-4x por semana, sessoes de 30-60min
**Nivel tecnico**: Intermediario (usa computador, nao programa)
**Dados no sistema**: Plano curricular semestral (PDF), lista de alunos, notas anteriores
```

---

## Como definir Input Realista

### Regras
1. **Especificidade**: Incluir detalhes que o usuario real incluiria
2. **Contexto**: Mencionar dados que o usuario ja tem no sistema
3. **Objetivo claro**: O usuario sabe o que quer (nao "me fale sobre X")
4. **Linguagem natural**: Como o usuario realmente escreveria/falaria

### Exemplos por tipo

| Tipo | Input RUIM | Input BOM |
|------|-----------|----------|
| Chat | "O que e IA?" | "Como posso usar IA para corrigir redacoes do 9o ano de forma que o feedback seja construtivo e alinhado a BNCC?" |
| Report | "Gere um relatorio" | "Gere relatorio mensal de desempenho da turma 7B em matematica, comparando com o bimestre anterior" |
| Image | "Crie uma imagem" | "Crie banner para o mural da escola sobre a Semana do Meio Ambiente, estilo colorido, para criancas de 8-10 anos" |
| Code | "Crie um componente" | "Crie componente React de tabela de notas com: filtro por disciplina, ordenacao por nome/nota, destaque para notas < 5" |

---

## Proibicoes (Anti-Patterns em Cenarios)

1. **NUNCA** input generico de demo ("What is AI?", "Hello world")
2. **NUNCA** `.catch(() => false)` — falha silenciosa mascara bugs
3. **NUNCA** `if (visible) { test }` sem `else { fail }` — pode nao testar nada
4. **NUNCA** avaliar screenshot generico como unica evidencia
5. **NUNCA** pular L1/L2 e ir direto para L3 — desperdiça dinheiro em judge call quando feature esta quebrada
6. **NUNCA** rubrica generica para cenario especifico
7. **NUNCA** cenario sem persona (quem e o usuario?)
8. **NUNCA** assumir estado do sistema (dados carregados, config feita)

---

## Referencia

- Pattern PDCA: `~/.shared/patterns/qat-pdca-cycle.md`
- Pattern Rubricas: `~/.shared/patterns/qat-rubric-design.md`
- Templates: `~/.shared/templates/qat/`
- Agent: `~/.claude/agents/ag-Q-40-testar-qualidade.md`
- Scenario Designer: `~/.claude/agents/ag-Q-41-criar-cenario-qat.md`
