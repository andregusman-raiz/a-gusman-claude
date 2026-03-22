# Anti-Patterns: QAT-01 — Chat Educacional Simples

> Outputs que DEVEM receber nota baixa do Judge.
> Cada anti-pattern explica o MOTIVO para calibrar a avaliacao.

## AP-1: Resposta generica sem exemplos praticos

**Exemplo de output ruim:**
```
A IA tem muitas vantagens na educacao. Ela pode ajudar os alunos a aprender melhor,
os professores a ensinar melhor e as escolas a funcionar melhor. A tecnologia esta
mudando a educacao e a IA e parte disso. Existem muitas ferramentas disponiveis
que podem ser uteis.
```

**Por que e ruim:**
- Zero exemplos praticos (professor pediu EXPLICITAMENTE)
- Vago e circular ("ajudar a aprender melhor" nao diz COMO)
- Nenhuma ferramenta mencionada por nome
- Nao contextualiza para escola publica brasileira
- Parece resposta de chatbot generico, nao assistente educacional

**Score esperado:** 2-3

---

## AP-2: Lista superficial sem profundidade

**Exemplo de output ruim:**
```
Vantagens da IA na educacao:
1. Personalizacao
2. Automacao
3. Acessibilidade
4. Analise de dados
5. Gamificacao
6. Traducao
7. Correcao automatica
8. Tutoria virtual
9. Adaptacao curricular
10. Reducao de custos
```

**Por que e ruim:**
- Lista de 10 itens sem explicacao alguma
- Nenhum exemplo pratico (requisito explicito do usuario)
- Sem contextualizacao para realidade escolar
- Quantidade nao substitui qualidade
- Professor nao consegue aplicar nada disso na segunda-feira

**Score esperado:** 2-3

---

## AP-3: Resposta em idioma errado

**Exemplo de output ruim:**
```
Sure! Here are the advantages of AI in education:
1. Personalized learning paths for each student
2. Automated grading saves teacher time
3. Adaptive assessments identify learning gaps
```

**Por que e ruim:**
O prompt foi em portugues. Resposta em ingles indica que o sistema
nao detectou o idioma ou ignorou o contexto. Penalidade: -3 em todos os criterios.

**Score esperado:** 1-2

---

## AP-4: Resposta tecnicamente correta mas inaplicavel

**Exemplo de output ruim:**
```
A IA na educacao utiliza redes neurais transformer com mecanismos de atencao
multi-head para processar sequencias de tokens educacionais. O fine-tuning de
LLMs com datasets pedagogicos permite personalizar o aprendizado atraves de
reinforcement learning from human feedback (RLHF). Recomendo implementar um
pipeline de MLOps com Kubernetes para orquestrar os modelos em producao,
utilizando GPUs A100 para inferencia em tempo real.
```

**Por que e ruim:**
- Linguagem inacessivel para professor de ensino fundamental
- Foco em tecnologia, nao em pedagogia
- Sugestoes impossiveis para escola publica (GPUs A100, Kubernetes)
- Nao responde "exemplos praticos que eu possa aplicar"
- Demonstra conhecimento tecnico mas zero empatia com o usuario

**Score esperado:** 2-4

---

## AP-5: Resposta excessivamente otimista sem consideracoes

**Exemplo de output ruim:**
```
A IA vai revolucionar completamente a educacao! Com ela, todos os alunos
vao aprender no seu ritmo, os professores nao vao mais precisar corrigir
provas, e as escolas vao ser totalmente automatizadas. Em poucos anos,
a IA vai substituir metodos tradicionais e resolver todos os problemas
da educacao brasileira. Basta instalar as ferramentas e pronto!
```

**Por que e ruim:**
- Tom de propaganda, nao de orientacao profissional
- Promessas irrealistas ("resolver todos os problemas")
- Ignora limitacoes reais (infraestrutura, formacao, custo)
- Nao menciona etica, privacidade ou LGPD
- Pode gerar frustracao quando expectativas nao se confirmarem

**Score esperado:** 3-4
