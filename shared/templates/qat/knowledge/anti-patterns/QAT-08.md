# Anti-Patterns: QAT-08 — Extended Thinking (Analise Profunda)

> Outputs que DEVEM receber nota baixa do Judge.
> Cada anti-pattern explica o MOTIVO para calibrar a avaliacao.

## AP-1: Analise superficial disfarçada de profunda

**Exemplo de output ruim:**
```
A queda de desempenho no 6o ano acontece por varios motivos:

1. Os alunos mudam de escola
2. Tem mais materias
3. Os professores sao diferentes
4. A puberdade atrapalha
5. A escola e mais dificil

Para resolver, e preciso mais investimento na educacao e apoio aos alunos.
```

**Por que e ruim:**
- Lista superficial sem analise (apenas enumera, nao explica relacoes causais)
- Nenhuma evidencia ou dado citado
- Nenhuma subdivisao por dimensao (pedagogica, socioemocional, estrutural — como pedido)
- Recomendacao generica ("mais investimento") sem acoes concretas
- Nao demonstra "extended thinking" — poderia ser resposta de 10 segundos

**Score esperado:** 2-3

---

## AP-2: Copia de artigo academico sem aplicabilidade

**Exemplo de output ruim:**
```
Segundo Piaget (1972), o estagio operatorio formal inicia-se por volta dos 11-12 anos,
coincidindo com a transicao do Ensino Fundamental I para o II. Vygotsky (1934) argumenta
que a zona de desenvolvimento proximal e crucial neste periodo. Bronfenbrenner (1979)
propoe o modelo ecologico com microssistema, mesossistema, exossistema e macrossistema.
A teoria da autodeterminacao de Deci e Ryan (1985) sugere que motivacao intrinseca...

[continua por 2000 palavras sem nenhuma recomendacao pratica]
```

**Por que e ruim:**
- Excesso de teoria sem conexao com a pratica do coordenador pedagogico
- Nenhuma recomendacao acionavel (curto, medio ou longo prazo)
- Tom de dissertacao academica, nao de consultoria profissional
- Nao responde "o que fazer" — apenas "o que dizem os teoricos"
- Coordenador pedagogico precisa de acoes, nao de revisao bibliografica

**Score esperado:** 3-4

---

## AP-3: Resposta em idioma errado

**Exemplo de output ruim:**
```
The decline in 6th grade performance is a well-documented phenomenon in Brazilian education.
Key factors include: pedagogical rupture, socio-emotional changes during puberty, and
structural issues in the education system...
```

**Por que e ruim:**
O prompt foi em portugues para coordenador pedagogico brasileiro. Resposta em ingles
indica falha na deteccao de idioma. Penalidade: -3 em todos os criterios.

**Score esperado:** 1-2

---

## AP-4: Analise unidimensional quando multicamada foi solicitada

**Exemplo de output ruim:**
```
## Analise da Queda de Desempenho no 6o Ano

O principal motivo da queda e a mudanca no modelo pedagogico. No Fundamental I,
o aluno tem um professor polivalente que conhece suas necessidades. No Fundamental II,
passa a ter 8-10 professores especialistas que nao tem tempo de conhecer cada aluno.

Isso gera uma ruptura no vinculo pedagogico que impacta diretamente o aprendizado.
A solucao e investir em formacao de professores do Fund. II para que adotem
abordagens mais personalizadas.
```

**Por que e ruim:**
- Aborda APENAS o fator pedagogico (usuario pediu pedagogicos + socioemocionais + estruturais)
- Ignora completamente a puberdade e aspectos emocionais da pre-adolescencia
- Ignora fatores estruturais (organizacao do sistema, investimento, politicas publicas)
- Solucao unica e simplista ("formacao de professores") vs abordagem multi-nivel
- Nao demonstra "analise profunda" — e analise unilateral

**Score esperado:** 3-4

---

## AP-5: Recomendacoes sem diagnostico

**Exemplo de output ruim:**
```
Para resolver a queda de desempenho no 6o ano, recomendo:

1. Implementar avaliacao diagnostica no inicio do ano
2. Criar programa de tutoria
3. Formar professores em competencias socioemocionais
4. Integrar curriculo do Fund. I com Fund. II
5. Envolver pais no processo de transicao
6. Monitorar indicadores trimestralmente
7. Criar sala de reforco
8. Implementar programa de mentoria entre alunos
9. Diversificar metodologias de ensino
10. Investir em tecnologia educacional
```

**Por que e ruim:**
- Pula direto para solucoes sem diagnosticar o problema
- Nao explica POR QUE a queda acontece (que era a pergunta)
- Lista de 10 recomendacoes genericas sem priorizacao ou horizonte temporal
- Sem evidencias ou dados que justifiquem cada recomendacao
- Coordenador nao sabe por onde comecar — tudo parece igualmente importante

**Score esperado:** 3-4
