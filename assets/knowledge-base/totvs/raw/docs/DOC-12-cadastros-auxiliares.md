# DOC 12 — Cadastros Auxiliares Completos

> Referência completa das tabelas auxiliares configuráveis do TOTVS RM Educacional.
> Fonte: API Legada TOTVS (EduStatusData, EduTipoMatriculaData, etc.) + TDN + Fórum RM.
> Data: 2026-03-22

---

## 1. SSTATUS — Situação de Matrícula (tabela mestre)

**PK**: `CODCOLIGADA; CODSTATUS`
**Usada por**: SHABILITACAOALUNO.CODSTATUS (curso), SMATRICPL.CODSTATUS (período letivo), SMATRICULA.CODSTATUS (disciplina)
**Valores são configuráveis por escola** — as flags booleanas definem o comportamento.

### 1.1 Campos de Identificação

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODSTATUS | Int32 | — | Sim | 0 | Código (auto-incremental) |
| DESCRICAO | String | 30 | Sim | — | Nome do status (texto livre, ex: "Matriculado") |
| CODTIPOCURSO | Int16 | — | Sim | — | FK → STipoCurso (nível de ensino) |
| CODEXTERNO | String | — | Não | — | Código externo (integração) |

### 1.2 Escopo de Aplicação

| Flag | Default | `S` = |
|------|---------|-------|
| CURSO | N | Este status se aplica ao nível do CURSO |
| PLETIVO | N | Este status se aplica ao PERÍODO LETIVO |
| DISCIPLINA | N | Este status se aplica à DISCIPLINA |

### 1.3 Natureza do Status — O que ele representa

| Flag | Default | `S` = | Uso típico |
|------|---------|-------|------------|
| **PLATIVO** | N | Aluno ATIVO neste status | "Matriculado", "Rematriculado" |
| **MATRICULAPROVISORIA** | N | PRÉ-MATRÍCULA / matrícula provisória | "Pré-Matriculado" |
| **PLREMATRICULA** | N | REMATRÍCULA | "Rematriculado" |
| **PLINDICATRANC** | N | TRANCAMENTO de curso | "Trancado" |
| **DIINDICATRANC** | N | Trancamento de DISCIPLINA | "Disc. Trancada" |
| **CUCONCCURSO** | N | CONCLUSÃO de curso | "Concluído", "Formado" |
| **CUINDICAJUBILADO** | N | JUBILAMENTO | "Jubilado" |
| **CUINDICATRANSF** | N | TRANSFERÊNCIA | "Transferido" |
| **CUINDICADESVINCULACAO** | N | DESVINCULAÇÃO | "Desvinculado" |
| **APROVADO** | N | APROVAÇÃO | "Aprovado" |
| **RESULTADO** | N | É status de RESULTADO FINAL | "Aprovado", "Reprovado" |

### 1.4 Comportamento Financeiro

| Flag | Default | `S` = |
|------|---------|-------|
| **PLEXIGECONTRATO** | N | Exige contrato financeiro para ativar matrícula |
| **PLCANCELACONTRATO** | N | CANCELA contrato ao entrar neste status |
| **PLBLOQFINANC** | N | BLOQUEIA alterações financeiras |
| **PLVALINADIMPLMATRICPORTAL** | **S** | Valida inadimplência na matrícula pelo portal |
| CONTABCOMPETENCIA | N | Contabiliza competência |
| ABATEPOSTALTERSTATUS | N | Abate no postal ao alterar status |

### 1.5 Permissões Acadêmicas

| Flag | Default | `S` = |
|------|---------|-------|
| **CUPERMITEMATRICPL** | **S** | Permite matrícula no período letivo |
| **PLPERMITETRANCAMENTO** | N | Permite trancamento |
| **PLINCLUIRDISC** | N | Permite incluir disciplinas |
| **PLDISCAUTOMATICA** | N | Matrícula automática em disciplinas |
| **PLDISPENTURMACAO** | N | Dispensa enturmação |

### 1.6 Controle de Disciplinas

| Flag | Default | `S` = |
|------|---------|-------|
| DIEMCURSO | N | Disciplina "em curso" |
| DICREDITOCURSADO | N | Crédito cursado |
| DIHISTORICO | N | Aparece no histórico escolar |
| DICONTCRTES | N | Conta créditos |
| DIVALIDAPRE | N | Valida pré-requisitos |
| DIINCALUNODISC | N | Inclui aluno na disciplina |

### 1.7 Bloqueios

| Flag | Default | `S` = |
|------|---------|-------|
| PLBLQALTSITMAT | N | Bloqueia alteração de situação de matrícula |
| PLBLQALTSITSEMDOC | N | Bloqueia alteração sem documentação completa |
| PLBLQALTSITMATSEMFIADORAPROV | N | Bloqueia sem fiador aprovado |
| DIBLOQNOTAFALTA | N | Bloqueia lançamento de notas e faltas |
| DIBLQALTSITMATDISC | N | Bloqueia alteração de status na disciplina |
| DIBLQALTSITMATDISCPRT | N | Bloqueia alteração de status (portal) |

### 1.8 Portal / Web

| Flag | Default | `S` = |
|------|---------|-------|
| DISPONIVELWEB | N | Status visível no portal do aluno |
| LISTAGENSWEB | N | Disponível em listagens web |
| NOTASFALTASWEB | N | Notas/faltas visíveis no portal |
| PERALUMATRICWEB | N | Permite matrícula pelo portal |
| PERALUINCDISC | N | Permite incluir disciplina (portal) |
| PERALUEXCDISC | N | Permite excluir disciplina (portal) |
| PERALUINCITINERARIO | N | Permite incluir itinerário (portal) |
| PERALUEXCITINERARIO | N | Permite excluir itinerário (portal) |

### 1.9 Cascata — Ao mudar para este status, altera automaticamente

| Campo | Tipo | Descrição |
|-------|------|-----------|
| CUCODSTATUSPL | Int32 | → muda CODSTATUS no **período letivo** (SMATRICPL) |
| PLCODSTATUSCUR | Int32 | → muda CODSTATUS no **curso** (SHABILITACAOALUNO) |
| PLCODSTATUSDISC | Int32 | → muda CODSTATUS nas **disciplinas** (SMATRICULA) |
| PLCODTIPOALUNO | Int16 | → muda **tipo do aluno** (STipoAluno) |
| PLCODSTATUSATIV | Int32 | → muda status **atividades complementares** |
| PLCODSTATUSDISCITINERARIO | Int32 | → muda status **disciplinas do itinerário** |

### 1.10 Outros

| Flag | Default | Descrição |
|------|---------|-----------|
| PLDIARIO | N | Exibe no diário |
| PLMDSTANTIGODISC | N | Usa módulo antigo de disciplina |
| ENVIAREMAILMUDSITMAT | N | Envia email ao mudar situação |
| EXIBEQUADROAVISO | N | Exibe no quadro de avisos |
| PLCANCELAUSUARIOCORPORE | N | Cancela usuário Corpore RM |
| PLCANCELAUSUARIOBIBLIOS | N | Cancela usuário Biblios (biblioteca) |
| PLPREENCHEDTMATENCCENSO | N | Preenche data matrícula/encerramento no censo |
| NOVORPTPLETIVOEMAIL | N | Novo relatório período letivo por email |
| CUSTATUSFLUIGCOMUNIDADE | N | Status Fluig Comunidade (curso) |
| PLSTATUSFLUIGCOMUNIDADE | N | Status Fluig Comunidade (período) |
| DISTATUSFLUIGCOMUNIDADE | N | Status Fluig Comunidade (disciplina) |

### 1.11 Prioridade e Limites de Disciplinas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| PLPRIORIDADE | String | Prioridade para matrícula nas disciplinas |
| PLORDDISCPERANT | Int32 | Ordem disciplinas período anterior |
| PLLIMITEDISCPERANT | Int32 | Limite disciplinas período anterior |
| PLORDDISCPERPOST | Int32 | Ordem disciplinas período posterior |
| PLLIMITEDISCPERPOST | Int32 | Limite disciplinas período posterior |

### 1.12 Email / Relatório

| Campo | Tipo | Descrição |
|-------|------|-----------|
| TEMPLATEENVIOEMAIL | String | Template de email (variáveis: `_NOMEDOALUNO_`, `_RAALUNO_`, etc.) |
| IDRELATORIO | String | ID do relatório associado |
| COLIGADARELATORIO | String | Coligada do relatório |
| IDRPTPLETIVOEMAIL | Int32 | ID relatório período letivo por email |
| CODCOLIGADARPTPLETIVOEMAIL | Int32 | Coligada do relatório |

### 1.13 Exemplos de Configuração Típica

| CODSTATUS | DESCRICAO | PLATIVO | MATRICULAPROVISORIA | PLREMATRICULA | PLINDICATRANC | CUCONCCURSO | CUINDICATRANSF | PLEXIGECONTRATO |
|-----------|-----------|---------|---------------------|---------------|---------------|-------------|----------------|-----------------|
| 1 | Matriculado | **S** | N | N | N | N | N | **S** |
| 2 | Pré-Matriculado | N | **S** | N | N | N | N | N |
| 3 | Rematriculado | **S** | N | **S** | N | N | N | **S** |
| 4 | Trancado | N | N | N | **S** | N | N | N |
| 5 | Cancelado | N | N | N | N | N | N | N |
| 6 | Transferido | N | N | N | N | N | **S** | N |
| 7 | Concluído | N | N | N | N | **S** | N | N |
| 8 | Evadido | N | N | N | N | N | N | N |
| 9 | Jubilado | N | N | N | N | N | N | N |

> **ATENÇÃO**: valores acima são **exemplos típicos**. Cada escola configura seus próprios CODSTATUS e DESCRICAO. As flags é que determinam o comportamento real.

---

## 2. STIPOMATRICULA — Tipo de Matrícula

**PK**: `CODCOLIGADA; CODTIPOMAT`
**Usada por**: SMATRICPL.CODTIPOMAT

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODTIPOMAT | Int16 | — | Sim | 0 | Código (auto-incremental) |
| DESCRICAO | String | 60 | Sim | — | Descrição (configurável) |
| CODTIPOCURSO | Int16 | — | Sim | — | FK → STipoCurso |
| PERMITETRANCAMENTO | String | 1 | Não | 0 | Permite trancamento (S/N) |
| INDICADEPENDENCIA | String | 1 | Não | 0 | Indica dependência (S/N) |

**Valores típicos**:

| CODTIPOMAT | DESCRICAO | PERMITETRANCAMENTO | INDICADEPENDENCIA |
|------------|-----------|--------------------|--------------------|
| 1 | Regular | S | N |
| 2 | Dependência | N | **S** |
| 3 | Adaptação | S | N |
| 4 | Transferido | S | N |
| 5 | Complementação de Carga Horária | N | N |

---

## 3. STIPOINGRESSO — Tipo de Ingresso

**PK**: `CODCOLIGADA; CODTIPOINGRESSO`
**Usada por**: SHABILITACAOALUNO.CODTIPOINGRESSO

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODTIPOINGRESSO | Int16 | — | Sim | 0 | Código (auto-incremental) |
| DESCRICAO | String | 60 | Sim | — | Descrição (configurável) |
| CODTIPOCURSO | Int16 | — | Sim | — | FK → STipoCurso |
| TIPOINGRESSO | Int32 | — | Sim | — | Código MEC — Diploma Digital |

**Valores típicos**:

| CODTIPOINGRESSO | DESCRICAO | TIPOINGRESSO (MEC) |
|-----------------|-----------|---------------------|
| 1 | Vestibular | 1 |
| 2 | ENEM | 2 |
| 3 | Transferência | 3 |
| 4 | SISU | 4 |
| 5 | Seleção Simplificada | 5 |
| 6 | Histórico Escolar | — |
| 7 | FIES | — |

**Enum TIPOINGRESSO (Diploma Digital — MEC layout 1.05)**:

| Valor | Descrição | Status |
|-------|-----------|--------|
| — | Vestibular | Mantido |
| — | ENEM | Mantido |
| — | SISU | Mantido |
| — | Transferência | Mantido |
| — | Programas de avaliação seriada | Mantido |
| — | Seleção Simplificada | **Novo** no layout 1.05 |
| — | Egresso BI/LI | **Novo** |
| — | PEC-G | **Novo** |
| — | Decisão judicial | **Novo** |
| — | Seleção para Vagas Remanescentes | **Novo** |
| — | Seleção para Vagas de Programas Especiais | **Novo** |
| — | ~~Convênio~~ | **Removido** no 1.05 |
| — | ~~Histórico Escolar~~ | **Removido** |
| — | ~~Prova agendada~~ | **Removido** |
| — | ~~Entrevista~~ | **Removido** |
| — | ~~Outros~~ | **Removido** |

> Disponível apenas para **ensino superior**. Valores numéricos exatos do enum MEC não documentados publicamente — dependem da versão do TOTVS RM instalada.

---

## 4. STIPOALUNO — Tipo de Aluno

**PK**: `CODCOLIGADA; CODTIPOALUNO`
**Usada por**: SAluno.CODTIPOALUNO, SSTATUS.PLCODTIPOALUNO (cascata)

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODTIPOALUNO | Int16 | — | Sim | 0 | Código (auto-incremental) |
| DESCRICAO | String | 60 | Sim | — | Descrição (configurável) |
| CODTIPOCURSO | Int16 | — | Sim | 0 | FK → STipoCurso |

**Valores típicos**:

| CODTIPOALUNO | DESCRICAO |
|-------------|-----------|
| 1 | Ativo |
| 2 | Egresso |
| 3 | Trancado |
| 4 | Cancelado |
| 5 | Desistente |
| 6 | Transferido |

---

## 5. STIPOCURSO — Nível de Ensino

**PK**: `CODCOLIGADA; CODTIPOCURSO`
**Usada por**: SCURSO, SDISCIPLINA, SSTATUS, SPLETIVO, SALUNO, STURMADISC, e praticamente todas as tabelas educacionais.

| Campo | Tipo | Size | Obrig. | Default | Descrição |
|-------|------|------|--------|---------|-----------|
| CODCOLIGADA | Int16 | — | Sim | 1 | Coligada |
| CODTIPOCURSO | Int16 | — | Sim | 0 | Código |
| NOME | String | 60 | Sim | — | Nome do nível |
| APRESENTACAO | String | — | Sim | 0 | Apresentação |
| CFGMATRICULA | String | 20 | Não | ########## | Máscara do RA |
| EMAIL | String | 60 | Não | — | Email do nível |
| USAEDUCACENSO | String | 1 | Não | N | Usa Educa Censo (S/N) |

**Valores típicos**:

| CODTIPOCURSO | NOME | Abrange |
|-------------|------|---------|
| 1 | Ensino Superior | Graduação, Tecnólogo, Pós-Graduação, Mestrado, Doutorado |
| 2 | Ensino Básico | Educação Infantil, Fundamental, Médio |
| 3+ | (configurável) | Cursos Livres, Técnicos, Extensão |

> Cursinhos, técnicos profissionalizantes geralmente são cadastrados como "Ensino Superior" pela flexibilidade de oferta.

---

## 6. STITULACAO — Titulação do Professor

**PK**: `CODCOLIGADA; CODTITULACAO`
**Usada por**: SPROFESSOR.CODTITULACAO

| CODTITULACAO | NOME (típico) |
|-------------|---------------|
| 1 | Graduado |
| 2 | Especialista |
| 3 | Mestre |
| 4 | Doutor |
| 5 | Pós-Doutor |

---

## 7. SMOTIVOALTSITMAT — Motivo de Alteração de Matrícula

**Usada por**: Processo "Alterar Situação de Matrícula"

**Valores típicos**:
| Código | DESCRICAO |
|--------|-----------|
| 1 | Rematrícula |
| 2 | Matrícula |
| 3 | Aprovado |
| 4 | Reprovado |
| 5 | Mudança de curso |

---

## 8. Valores Fixos (hardcoded no sistema)

### FLAN.STATUSLAN — Status do Lançamento Financeiro

| Valor | Significado |
|-------|-------------|
| **0** | Aberto |
| **1** | Baixado (pago) |
| **2** | Cancelado |

### SBOLSA.TIPODESC — Tipo de Desconto

| Valor | Significado |
|-------|-------------|
| **P** | Percentual |
| **V** | Valor fixo |

### SETAPAS.TIPOETAPA / SNOTAETAPA.TIPOETAPA

| Valor | Significado |
|-------|-------------|
| **N** | Nota |
| **F** | Falta |

### SDISCGRADE.TIPODISC — Tipo de Disciplina na Grade

| Valor | Significado |
|-------|-------------|
| **B** | Básica/Obrigatória |
| **O** | Optativa |
| **E** | Eletiva |

### SDISCIPLINA.TIPONOTA — Tipo de Nota

| Valor | Significado |
|-------|-------------|
| **N** | Numérica |
| **C** | Conceito |

### SALUNO / Genérico — Flags S/N

| Valor | Significado |
|-------|-------------|
| **S** | Sim / Ativo / Presente |
| **N** | Não / Inativo / Ausente |

### SCURSO.CURPRESDIST — Modalidade

| Valor | Significado |
|-------|-------------|
| **P** | Presencial |
| **D** | Distância |

---

## 9. Resumo: Onde buscar cada informação

| Pergunta | Tabela | Campo | Join com |
|----------|--------|-------|----------|
| Aluno está ativo? | SHABILITACAOALUNO | CODSTATUS | SSTATUS (PLATIVO='S') |
| É pré-matrícula? | SHABILITACAOALUNO | CODSTATUS | SSTATUS (MATRICULAPROVISORIA='S') |
| É rematrícula? | SHABILITACAOALUNO | CODSTATUS | SSTATUS (PLREMATRICULA='S') |
| Está trancado? | SHABILITACAOALUNO | CODSTATUS | SSTATUS (PLINDICATRANC='S') |
| Concluiu? | SHABILITACAOALUNO | CODSTATUS | SSTATUS (CUCONCCURSO='S') |
| Como ingressou? | SHABILITACAOALUNO | CODTIPOINGRESSO | STIPOINGRESSO.DESCRICAO |
| Tipo de matrícula? | SMATRICPL | CODTIPOMAT | STIPOMATRICULA.DESCRICAO |
| Status no período? | SMATRICPL | CODSTATUS | SSTATUS.DESCRICAO |
| Status na disciplina? | SMATRICULA | CODSTATUS | SSTATUS.DESCRICAO |
| Resultado final? | SMATRICPL ou SMATRICULA | CODSTATUSRES | SSTATUS.DESCRICAO |
| Tipo do aluno? | SALUNO | CODTIPOALUNO | STIPOALUNO.DESCRICAO |
| Nível de ensino? | SCURSO | CODTIPOCURSO | STIPOCURSO.NOME |

---

*Documento gerado em 2026-03-22. Fonte: API Legada TOTVS + TDN + Fórum RM + UNIFAGOC.*
