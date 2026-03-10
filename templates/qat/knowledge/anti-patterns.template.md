# Anti-Patterns: QAT-XX — CUSTOMIZE: Nome do cenario

> Outputs que DEVEM receber nota baixa do Judge.
> Cada anti-pattern explica o MOTIVO para calibrar a avaliacao.

## AP-1: CUSTOMIZE: Nome do anti-pattern

**Exemplo de output ruim:**
```
CUSTOMIZE: Cole aqui um exemplo de output que deve falhar
```

**Por que e ruim:**
CUSTOMIZE: Explique o que faz este output ser inaceitavel

**Score esperado:** 1-3

---

## AP-2: CUSTOMIZE: Nome do anti-pattern

**Exemplo de output ruim:**
```
CUSTOMIZE: Outro exemplo de output que deve falhar
```

**Por que e ruim:**
CUSTOMIZE: Explicacao

**Score esperado:** 2-4

---

## AP-3: Resposta em idioma errado

**Exemplo de output ruim:**
```
Sure! Here are the advantages of AI in education:
1. Personalized learning...
2. Automated grading...
```

**Por que e ruim:**
O prompt foi em portugues. Resposta em ingles indica que o sistema
nao detectou o idioma ou ignorou o contexto. Penalidade: -3 em todos os criterios.

**Score esperado:** 2-4
