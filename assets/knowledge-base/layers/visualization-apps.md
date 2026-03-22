# Layers Education — Visualization Apps (Apps Visualizadores)

> Todos os apps visualizadores operam atraves do API Hub usando o padrao Request & Respond.
> Provedores (ERPs) fornecem dados; a Layers renderiza nos portais.

---

## Visao Geral

Apps visualizadores sao componentes que permitem que sistemas integrados fornecam informacoes especificas para exibicao na plataforma Layers. Cada app opera como um Action endpoint dentro do API Hub.

---

## 1. Notas Academicas

**Action:** Prover notas academicas

Permite fornecer informacoes sobre avaliacoes, notas e desempenho academico.

**Exemplos interativos disponivesis:**
1. **Periodo unico, multiplas disciplinas** — Um periodo letivo com duas disciplinas
2. **Multiplos periodos com categorias** — Varios periodos letivos e categorias de classificacao
3. **Periodo encerrado com anexos** — Periodo academico concluido com anexos de arquivos

**Estrutura de dados flexivel:** Suporta diferentes metodologias de avaliacao institucional, incluindo divisoes de periodo, categorizacao de disciplinas e anexos de documentos.

---

## 2. Visao Financeira

**Action:** Prover cobrancas

Permite fornecer informacoes de faturamento, pagamentos e dados financeiros.

**Exemplos interativos:**
1. **Uma cobranca pendente** — Cenario de boleto unico pendente
2. **Multiplas parcelas** — Status de pago, pendente e vencido
3. **Cobranca com anexos** — Cobrancas com documentos suplementares

---

## 3. Frequencia

**Action:** Prover frequencia

Permite fornecer informacoes sobre presencas, faltas e controle de frequencia.

**Exemplos interativos:**
1. **Resumo geral do aluno** — Visao geral de frequencia individual
2. **Frequencia por disciplina e categorias** — Informacoes organizadas por disciplina com categorias
3. **Registros detalhados** — Dados granulares incluindo presencas, faltas e faltas justificadas

---

## 4. Registros Academicos

**Actions:**
- Prover registros academicos
- Marcar registros como vistos

Permite fornecer informacoes sobre ocorrencias, observacoes e registros disciplinares.

**Exemplos interativos:**
1. **Registro unico nao visualizado** — Cenario basico de uma ocorrencia
2. **Multiplos registros com status de visualizacao** — Registros visualizados/nao visualizados
3. **Registros agrupados por periodo e curso** — Filtragem organizacional

**Endpoints especificos:**
- Prover registros academicos (fornecer dados)
- Marcar registros como vistos (gerenciar estado de leitura)

---

## 5. Visao de Horarios

**Action:** Prover grades horarias

Permite fornecer grades horarias e cronogramas de aulas.

**Exemplos interativos:**
1. **Horario simples de um dia** — Exibicao basica
2. **Semana completa com multiplas disciplinas** — Grade semanal
3. **Periodo com anexo PDF** — Horario com documento anexo

---

## 6. Ficha Medica

**Action:** Prover ficha medica

Permite fornecer informacoes sobre prontuarios, alergias e condicoes de saude.

**Exemplos interativos:**
1. **Prontuario basico** — Contato e peso
2. **Multiplas secoes com anexos** — Varias secoes de dados + arquivos
3. **Prontuario completo com mood** — Historico medico completo com indicadores de humor

---

## 7. Calendario

**Action:** Prover calendario

Permite fornecer informacoes sobre eventos, atividades e compromissos academicos.

**Exemplos interativos:**
1. **Um evento em um dia** — Entrada basica de calendario
2. **Multiplos eventos e categorias** — Varios eventos em diferentes categorias
3. **Calendario semanal com eventos recorrentes** — Visao semanal com padroes repetitivos

---

## 8. Relatorios

**Actions:**
- Prover documentos
- Construir formulario
- Gerar relatorio

Permite fornecer documentos, formularios e relatorios para visualizacao e geracao.

**Exemplos interativos:**
1. **Grupo unico com relatorio PDF** — Entrega basica de PDF
2. **Multiplos anexos (relatorio e planilha)** — Cenario multi-arquivo
3. **Multiplos grupos (organizados por periodo ou tipo)** — Estrategias de agrupamento

---

## 9. Entrada e Saida

**Actions:**
- Prover entradas e saidas por usuario
- Prover entradas e saidas por data de atualizacao
- Publicar nova entrada ou saida

Permite fornecer registros de entrada e saida de alunos.

**Endpoints:**
1. **Por usuario** — Registros filtrados por usuario individual
2. **Por data de atualizacao** — Registros filtrados por timestamp de atualizacao
3. **Publicar novo registro** — Cria e publica novos eventos de entrada/saida (Pub/Sub)

---

## Padrao de Integracao Comum

Todos os apps visualizadores seguem o mesmo padrao:

1. App consumidor (portal Layers) descobre provedores via `GET /v1/services/discover/:action`
2. Portal chama `POST /v1/services/call/:action/:providerId?version=N`
3. Layers adiciona `context` e `secret` e encaminha ao provedor
4. Provedor valida `secret`, processa e retorna dados no formato da action
5. Layers renderiza os dados no portal

---

## Notas

- Cada app pode ter multiplas versoes de action
- Exemplos interativos estao disponiveis na documentacao oficial para cada app
- Todos os apps suportam uso pelo API Hub (badge api-hub)
- Registros Academicos e Relatorios possuem multiplas actions cada
- Entrada e Saida usa tanto Request & Respond quanto Pub/Sub
