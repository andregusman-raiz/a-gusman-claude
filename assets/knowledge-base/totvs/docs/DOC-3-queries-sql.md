# DOC 3 — Mapa de Queries SQL por Funcionalidade

> Frontend TOTVS Educacional — Queries SQL para cada tela do sistema.
> Todas as queries usam MSSQL (Tedious driver) com prepared statements.
> Multi-tenant: CODCOLIGADA injetado server-side em TODAS as queries.

---

## Convenções

- `@coligada` = `CODCOLIGADA` (injetado pelo service layer, NUNCA do client)
- `@filial` = `CODFILIAL` (da sessão do usuário)
- `@param` = parâmetro do request (validado com Zod)
- Todas as queries usam `TOP(@limit)` para paginação (padrão 50)
- `OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY` para paginação server-side
- Prepared statements via `mssql.Request.input()` — NUNCA concatenação de string

---

## 1. Dashboard Secretaria

### 1.1 KPIs — Total de Alunos Ativos

```sql
SELECT COUNT(DISTINCT A.RA) AS total_alunos
FROM SALUNO A
INNER JOIN SMATRICULA M ON A.CODCOLIGADA = M.CODCOLIGADA AND A.RA = M.RA
WHERE A.CODCOLIGADA = @coligada
  AND M.CODFILIAL = @filial
  AND M.CODPERIODOLETIVO = @periodoLetivo
  AND M.STATUS = 'A'  -- Ativa
```

**Cache**: standard (5min) | **Perfil**: secretaria, coordenador, diretor

### 1.2 KPIs — Total de Turmas

```sql
SELECT COUNT(*) AS total_turmas
FROM STURMA T
WHERE T.CODCOLIGADA = @coligada
  AND T.CODFILIAL = @filial
  AND T.CODPERIODOLETIVO = @periodoLetivo
  AND T.STATUS = 'A'
```

**Cache**: standard (5min)

### 1.3 KPIs — Frequência Média

```sql
SELECT
  CAST(
    (SUM(CASE WHEN F.TIPO = 'P' THEN 1 ELSE 0 END) * 100.0) /
    NULLIF(COUNT(*), 0)
  AS DECIMAL(5,2)) AS freq_media
FROM SFALTA F
INNER JOIN STURMA T ON F.CODCOLIGADA = T.CODCOLIGADA AND F.CODTURMA = T.CODTURMA
WHERE F.CODCOLIGADA = @coligada
  AND T.CODFILIAL = @filial
  AND T.CODPERIODOLETIVO = @periodoLetivo
  AND F.DATA >= @dataIniEtapa
  AND F.DATA <= @dataFimEtapa
```

**Cache**: standard (5min)

### 1.4 KPIs — Matrículas Pendentes

```sql
SELECT COUNT(*) AS pendentes
FROM SMATRICULA M
WHERE M.CODCOLIGADA = @coligada
  AND M.CODFILIAL = @filial
  AND M.CODPERIODOLETIVO = @periodoLetivo
  AND M.STATUS = 'P'  -- Pendente
```

**Cache**: short (30s)

### 1.5 Matrículas por Série

```sql
SELECT
  H.NOME AS serie,
  COUNT(M.RA) AS total
FROM SMATRICULA M
INNER JOIN SHABILITACAO H ON M.CODCOLIGADA = H.CODCOLIGADA
  AND M.CODCURSO = H.CODCURSO AND M.CODHABILITACAO = H.CODHABILITACAO
WHERE M.CODCOLIGADA = @coligada
  AND M.CODFILIAL = @filial
  AND M.CODPERIODOLETIVO = @periodoLetivo
  AND M.STATUS = 'A'
GROUP BY H.NOME
ORDER BY H.NOME
```

**Cache**: standard (5min)

---

## 2. Lista de Alunos

### 2.1 Busca com Filtros e Paginação

```sql
SELECT
  A.RA,
  A.NOME,
  A.CPF,
  A.DATANASCIMENTO,
  T.NOME AS turma,
  H.NOME AS serie,
  M.STATUS AS status_matricula,
  M.CODTURMA
FROM SALUNO A
INNER JOIN SMATRICULA M ON A.CODCOLIGADA = M.CODCOLIGADA AND A.RA = M.RA
LEFT JOIN STURMA T ON M.CODCOLIGADA = T.CODCOLIGADA AND M.CODTURMA = T.CODTURMA
LEFT JOIN SHABILITACAO H ON M.CODCOLIGADA = H.CODCOLIGADA
  AND M.CODCURSO = H.CODCURSO AND M.CODHABILITACAO = H.CODHABILITACAO
WHERE A.CODCOLIGADA = @coligada
  AND M.CODFILIAL = @filial
  AND M.CODPERIODOLETIVO = @periodoLetivo
  AND (@busca IS NULL OR A.NOME LIKE '%' + @busca + '%' OR A.RA LIKE @busca + '%')
  AND (@codTurma IS NULL OR M.CODTURMA = @codTurma)
  AND (@codHabilitacao IS NULL OR M.CODHABILITACAO = @codHabilitacao)
  AND (@status IS NULL OR M.STATUS = @status)
ORDER BY A.NOME
OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
```

### 2.2 Contagem Total (para paginação)

```sql
SELECT COUNT(*) AS total
FROM SALUNO A
INNER JOIN SMATRICULA M ON A.CODCOLIGADA = M.CODCOLIGADA AND A.RA = M.RA
WHERE A.CODCOLIGADA = @coligada
  AND M.CODFILIAL = @filial
  AND M.CODPERIODOLETIVO = @periodoLetivo
  AND (@busca IS NULL OR A.NOME LIKE '%' + @busca + '%' OR A.RA LIKE @busca + '%')
  AND (@codTurma IS NULL OR M.CODTURMA = @codTurma)
  AND (@codHabilitacao IS NULL OR M.CODHABILITACAO = @codHabilitacao)
  AND (@status IS NULL OR M.STATUS = @status)
```

**Cache**: short (30s) | **Perfil**: secretaria (all), professor (own classes), coordenador (all)

---

## 3. Ficha do Aluno

### 3.1 Dados Pessoais

```sql
SELECT
  A.RA,
  A.NOME,
  A.NOMESOCIAL,
  A.CPF,
  A.DATANASCIMENTO,
  A.SEXO,
  A.NOMEPAI,
  A.NOMEMAE,
  A.EMAIL,
  A.TELEFONE,
  A.ENDERECO,
  A.BAIRRO,
  A.CIDADE,
  A.UF,
  A.CEP,
  A.NACIONALIDADE,
  A.NATURALIDADE
FROM SALUNO A
WHERE A.CODCOLIGADA = @coligada
  AND A.RA = @ra
```

### 3.2 Matrícula Atual

```sql
SELECT
  M.CODCURSO,
  M.CODHABILITACAO,
  M.CODGRADE,
  M.CODTURMA,
  M.CODPERIODOLETIVO,
  M.STATUS,
  M.DATAINICIO,
  M.DATAFIM,
  T.NOME AS turma,
  H.NOME AS serie,
  C.NOME AS curso
FROM SMATRICULA M
LEFT JOIN STURMA T ON M.CODCOLIGADA = T.CODCOLIGADA AND M.CODTURMA = T.CODTURMA
LEFT JOIN SHABILITACAO H ON M.CODCOLIGADA = H.CODCOLIGADA
  AND M.CODCURSO = H.CODCURSO AND M.CODHABILITACAO = H.CODHABILITACAO
LEFT JOIN SCURSO C ON M.CODCOLIGADA = C.CODCOLIGADA AND M.CODCURSO = C.CODCURSO
WHERE M.CODCOLIGADA = @coligada AND M.RA = @ra
  AND M.CODPERIODOLETIVO = @periodoLetivo
```

### 3.3 Notas do Período Atual

```sql
SELECT
  D.NOME AS disciplina,
  E.NOME AS etapa,
  N.NOTA,
  N.SITUACAO
FROM SNOTA N
INNER JOIN SDISCIPLINA D ON N.CODCOLIGADA = D.CODCOLIGADA AND N.CODDISC = D.CODDISC
INNER JOIN SETAPA E ON N.CODCOLIGADA = E.CODCOLIGADA AND N.CODETAPA = E.CODETAPA
WHERE N.CODCOLIGADA = @coligada
  AND N.RA = @ra
  AND E.CODPERIODOLETIVO = @periodoLetivo
ORDER BY D.NOME, E.CODETAPA
```

### 3.4 Frequência Consolidada

```sql
SELECT
  D.NOME AS disciplina,
  COUNT(*) AS total_aulas,
  SUM(CASE WHEN F.TIPO = 'P' THEN 1 ELSE 0 END) AS presencas,
  SUM(CASE WHEN F.TIPO = 'F' THEN 1 ELSE 0 END) AS faltas,
  SUM(CASE WHEN F.TIPO = 'FJ' THEN 1 ELSE 0 END) AS faltas_justificadas,
  CAST(
    SUM(CASE WHEN F.TIPO = 'P' OR F.TIPO = 'FJ' THEN 1 ELSE 0 END) * 100.0 /
    NULLIF(COUNT(*), 0) AS DECIMAL(5,2)
  ) AS percentual_freq
FROM SFALTA F
INNER JOIN SDISCIPLINA D ON F.CODCOLIGADA = D.CODCOLIGADA AND F.CODDISC = D.CODDISC
INNER JOIN STURMA T ON F.CODCOLIGADA = T.CODCOLIGADA AND F.CODTURMA = T.CODTURMA
WHERE F.CODCOLIGADA = @coligada
  AND F.RA = @ra
  AND T.CODPERIODOLETIVO = @periodoLetivo
GROUP BY D.CODDISC, D.NOME
ORDER BY D.NOME
```

### 3.5 Ocorrências

```sql
SELECT
  O.CODOCORRENCIA,
  O.DATA,
  O.TIPO,
  O.DESCRICAO,
  O.STATUS,
  P.NOME AS professor
FROM SOCORRENCIA O
LEFT JOIN SPROFESSOR P ON O.CODCOLIGADA = P.CODCOLIGADA AND O.CODPROFESSOR = P.CODPROFESSOR
WHERE O.CODCOLIGADA = @coligada
  AND O.RA = @ra
ORDER BY O.DATA DESC
```

### 3.6 Histórico de Matrículas (todos os anos)

```sql
SELECT
  PL.ANO,
  H.NOME AS serie,
  T.NOME AS turma,
  M.STATUS,
  M.DATAINICIO,
  M.DATAFIM
FROM SMATRICULA M
INNER JOIN SPLETIVO PL ON M.CODCOLIGADA = PL.CODCOLIGADA
  AND M.CODPERIODOLETIVO = PL.CODPERIODOLETIVO
LEFT JOIN SHABILITACAO H ON M.CODCOLIGADA = H.CODCOLIGADA
  AND M.CODCURSO = H.CODCURSO AND M.CODHABILITACAO = H.CODHABILITACAO
LEFT JOIN STURMA T ON M.CODCOLIGADA = T.CODCOLIGADA AND M.CODTURMA = T.CODTURMA
WHERE M.CODCOLIGADA = @coligada AND M.RA = @ra
ORDER BY PL.ANO DESC
```

**Cache**: standard (5min) | **Perfil**: secretaria (full), professor (own students read), coordenador (read)

---

## 4. Gestão de Turmas

### 4.1 Lista de Turmas

```sql
SELECT
  T.CODTURMA,
  T.NOME,
  H.NOME AS serie,
  T.CODTURNO,
  T.CAPACIDADE,
  (SELECT COUNT(*) FROM SMATRICULA M
   WHERE M.CODCOLIGADA = T.CODCOLIGADA AND M.CODTURMA = T.CODTURMA
   AND M.STATUS = 'A') AS qtd_alunos,
  PR.NOME AS professor_regente,
  T.STATUS
FROM STURMA T
LEFT JOIN SHABILITACAO H ON T.CODCOLIGADA = H.CODCOLIGADA
  AND T.CODCURSO = H.CODCURSO AND T.CODHABILITACAO = H.CODHABILITACAO
LEFT JOIN SPROFESSOR PR ON T.CODCOLIGADA = PR.CODCOLIGADA
  AND T.CODPROFESSORREGENTE = PR.CODPROFESSOR
WHERE T.CODCOLIGADA = @coligada
  AND T.CODFILIAL = @filial
  AND T.CODPERIODOLETIVO = @periodoLetivo
ORDER BY H.NOME, T.NOME
```

### 4.2 Alunos de uma Turma

```sql
SELECT
  A.RA,
  A.NOME,
  A.CPF,
  M.STATUS AS status_matricula,
  ROW_NUMBER() OVER (ORDER BY A.NOME) AS numero_chamada
FROM SALUNO A
INNER JOIN SMATRICULA M ON A.CODCOLIGADA = M.CODCOLIGADA AND A.RA = M.RA
WHERE A.CODCOLIGADA = @coligada
  AND M.CODTURMA = @codTurma
  AND M.CODPERIODOLETIVO = @periodoLetivo
  AND M.STATUS = 'A'
ORDER BY A.NOME
```

**Cache**: standard (5min)

---

## 5. Enturmação

### 5.1 Alunos sem Turma

```sql
SELECT A.RA, A.NOME, H.NOME AS serie
FROM SALUNO A
INNER JOIN SMATRICULA M ON A.CODCOLIGADA = M.CODCOLIGADA AND A.RA = M.RA
LEFT JOIN SHABILITACAO H ON M.CODCOLIGADA = H.CODCOLIGADA
  AND M.CODCURSO = H.CODCURSO AND M.CODHABILITACAO = H.CODHABILITACAO
WHERE A.CODCOLIGADA = @coligada
  AND M.CODFILIAL = @filial
  AND M.CODPERIODOLETIVO = @periodoLetivo
  AND M.STATUS = 'A'
  AND (M.CODTURMA IS NULL OR M.CODTURMA = '')
ORDER BY H.NOME, A.NOME
```

### 5.2 Turmas com Vagas

```sql
SELECT
  T.CODTURMA,
  T.NOME,
  H.NOME AS serie,
  T.CAPACIDADE,
  T.CAPACIDADE - (SELECT COUNT(*) FROM SMATRICULA M
    WHERE M.CODCOLIGADA = T.CODCOLIGADA AND M.CODTURMA = T.CODTURMA
    AND M.STATUS = 'A') AS vagas_disponiveis
FROM STURMA T
LEFT JOIN SHABILITACAO H ON T.CODCOLIGADA = H.CODCOLIGADA
  AND T.CODCURSO = H.CODCURSO AND T.CODHABILITACAO = H.CODHABILITACAO
WHERE T.CODCOLIGADA = @coligada
  AND T.CODFILIAL = @filial
  AND T.CODPERIODOLETIVO = @periodoLetivo
  AND T.STATUS = 'A'
HAVING T.CAPACIDADE - (SELECT COUNT(*) FROM SMATRICULA M
    WHERE M.CODCOLIGADA = T.CODCOLIGADA AND M.CODTURMA = T.CODTURMA
    AND M.STATUS = 'A') > 0
ORDER BY H.NOME, T.NOME
```

### 5.3 Enturmar Aluno (WRITE)

```sql
UPDATE SMATRICULA
SET CODTURMA = @codTurma
WHERE CODCOLIGADA = @coligada
  AND RA = @ra
  AND CODPERIODOLETIVO = @periodoLetivo
  AND STATUS = 'A'
```

**Cache**: invalidar turma + aluno | **Perfil**: secretaria (write), coordenador (read)

---

## 6. Dashboard Professor

### 6.1 Minhas Turmas Hoje

```sql
SELECT
  TD.CODTURMA,
  T.NOME AS turma,
  D.NOME AS disciplina,
  TD.HORARIO,
  (SELECT COUNT(*) FROM SFALTA F
   WHERE F.CODCOLIGADA = TD.CODCOLIGADA
   AND F.CODTURMA = TD.CODTURMA AND F.CODDISC = TD.CODDISC
   AND F.DATA = CAST(GETDATE() AS DATE)) AS chamada_feita
FROM STURMADISC TD
INNER JOIN STURMA T ON TD.CODCOLIGADA = T.CODCOLIGADA AND TD.CODTURMA = T.CODTURMA
INNER JOIN SDISCIPLINA D ON TD.CODCOLIGADA = D.CODCOLIGADA AND TD.CODDISC = D.CODDISC
WHERE TD.CODCOLIGADA = @coligada
  AND TD.CODPROFESSOR = @codProfessor
  AND T.CODPERIODOLETIVO = @periodoLetivo
  AND T.STATUS = 'A'
ORDER BY TD.HORARIO
```

### 6.2 Pendências de Notas

```sql
SELECT
  T.NOME AS turma,
  D.NOME AS disciplina,
  E.NOME AS etapa,
  E.DATAFIM AS prazo,
  (SELECT COUNT(*) FROM SMATRICULA M
   WHERE M.CODCOLIGADA = T.CODCOLIGADA AND M.CODTURMA = T.CODTURMA AND M.STATUS = 'A') AS total_alunos,
  (SELECT COUNT(DISTINCT N.RA) FROM SNOTA N
   WHERE N.CODCOLIGADA = TD.CODCOLIGADA AND N.CODTURMA = TD.CODTURMA
   AND N.CODDISC = TD.CODDISC AND N.CODETAPA = E.CODETAPA) AS notas_lancadas
FROM STURMADISC TD
INNER JOIN STURMA T ON TD.CODCOLIGADA = T.CODCOLIGADA AND TD.CODTURMA = T.CODTURMA
INNER JOIN SDISCIPLINA D ON TD.CODCOLIGADA = D.CODCOLIGADA AND TD.CODDISC = D.CODDISC
CROSS JOIN SETAPA E
WHERE TD.CODCOLIGADA = @coligada
  AND TD.CODPROFESSOR = @codProfessor
  AND T.CODPERIODOLETIVO = @periodoLetivo
  AND E.CODPERIODOLETIVO = @periodoLetivo
  AND E.DATAFIM >= GETDATE()
  AND T.STATUS = 'A'
ORDER BY E.DATAFIM, T.NOME
```

**Cache**: short (30s) | **Perfil**: professor (own), coordenador (all)

---

## 7. Diário de Classe / Chamada

### 7.1 Lista de Alunos para Chamada

```sql
SELECT
  A.RA,
  A.NOME,
  A.FOTO,
  ROW_NUMBER() OVER (ORDER BY A.NOME) AS numero_chamada,
  F.TIPO AS frequencia_atual
FROM SALUNO A
INNER JOIN SMATRICULA M ON A.CODCOLIGADA = M.CODCOLIGADA AND A.RA = M.RA
LEFT JOIN SFALTA F ON A.CODCOLIGADA = F.CODCOLIGADA AND A.RA = F.RA
  AND F.CODTURMA = @codTurma AND F.CODDISC = @codDisc AND F.DATA = @data
WHERE A.CODCOLIGADA = @coligada
  AND M.CODTURMA = @codTurma
  AND M.STATUS = 'A'
  AND M.CODPERIODOLETIVO = @periodoLetivo
ORDER BY A.NOME
```

### 7.2 Registrar Frequência (WRITE — batch)

```sql
-- Para cada aluno do array (executar em transaction)
MERGE INTO SFALTA AS target
USING (VALUES (@coligada, @ra, @codDisc, @codTurma, @data, @aula, @tipo))
  AS source (CODCOLIGADA, RA, CODDISC, CODTURMA, DATA, AULA, TIPO)
ON target.CODCOLIGADA = source.CODCOLIGADA
  AND target.RA = source.RA
  AND target.CODDISC = source.CODDISC
  AND target.DATA = source.DATA
  AND target.AULA = source.AULA
WHEN MATCHED THEN
  UPDATE SET TIPO = source.TIPO
WHEN NOT MATCHED THEN
  INSERT (CODCOLIGADA, RA, CODDISC, CODTURMA, DATA, AULA, TIPO)
  VALUES (source.CODCOLIGADA, source.RA, source.CODDISC, source.CODTURMA,
          source.DATA, source.AULA, source.TIPO);
```

**Cache**: invalidar chamada da turma+data | **Perfil**: professor (own turmas)

---

## 8. Lançamento de Notas

### 8.1 Grid de Notas (turma × avaliação)

```sql
SELECT
  A.RA,
  A.NOME,
  N.CODETAPA,
  N.NOTA,
  N.SITUACAO
FROM SALUNO A
INNER JOIN SMATRICULA M ON A.CODCOLIGADA = M.CODCOLIGADA AND A.RA = M.RA
LEFT JOIN SNOTA N ON A.CODCOLIGADA = N.CODCOLIGADA AND A.RA = N.RA
  AND N.CODDISC = @codDisc AND N.CODTURMA = @codTurma AND N.CODETAPA = @codEtapa
WHERE A.CODCOLIGADA = @coligada
  AND M.CODTURMA = @codTurma
  AND M.STATUS = 'A'
  AND M.CODPERIODOLETIVO = @periodoLetivo
ORDER BY A.NOME
```

### 8.2 Lançar/Atualizar Nota (WRITE)

```sql
MERGE INTO SNOTA AS target
USING (VALUES (@coligada, @ra, @codDisc, @codTurma, @codEtapa, @nota))
  AS source (CODCOLIGADA, RA, CODDISC, CODTURMA, CODETAPA, NOTA)
ON target.CODCOLIGADA = source.CODCOLIGADA
  AND target.RA = source.RA
  AND target.CODDISC = source.CODDISC
  AND target.CODETAPA = source.CODETAPA
WHEN MATCHED THEN
  UPDATE SET NOTA = source.NOTA, CODTURMA = source.CODTURMA
WHEN NOT MATCHED THEN
  INSERT (CODCOLIGADA, RA, CODDISC, CODTURMA, CODETAPA, NOTA)
  VALUES (source.CODCOLIGADA, source.RA, source.CODDISC, source.CODTURMA,
          source.CODETAPA, source.NOTA);
```

### 8.3 Etapas da Disciplina

```sql
SELECT
  E.CODETAPA,
  E.NOME,
  E.TIPO,
  E.PESO,
  E.DATAINI,
  E.DATAFIM
FROM SETAPA E
WHERE E.CODCOLIGADA = @coligada
  AND E.CODPERIODOLETIVO = @periodoLetivo
ORDER BY E.DATAINI
```

**Cache**: invalidar nota específica | **Perfil**: professor (own), coordenador (override)

---

## 9. Ocorrências Disciplinares

### 9.1 Listar Ocorrências

```sql
SELECT
  O.CODOCORRENCIA,
  A.NOME AS aluno,
  O.RA,
  O.DATA,
  O.TIPO,
  O.DESCRICAO,
  O.STATUS,
  P.NOME AS registrado_por,
  T.NOME AS turma
FROM SOCORRENCIA O
INNER JOIN SALUNO A ON O.CODCOLIGADA = A.CODCOLIGADA AND O.RA = A.RA
LEFT JOIN SPROFESSOR P ON O.CODCOLIGADA = P.CODCOLIGADA AND O.CODPROFESSOR = P.CODPROFESSOR
LEFT JOIN STURMA T ON O.CODCOLIGADA = T.CODCOLIGADA AND O.CODTURMA = T.CODTURMA
WHERE O.CODCOLIGADA = @coligada
  AND T.CODFILIAL = @filial
  AND (@codTurma IS NULL OR O.CODTURMA = @codTurma)
  AND (@tipo IS NULL OR O.TIPO = @tipo)
  AND (@dataIni IS NULL OR O.DATA >= @dataIni)
  AND (@dataFim IS NULL OR O.DATA <= @dataFim)
ORDER BY O.DATA DESC
OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
```

### 9.2 Criar Ocorrência (WRITE)

```sql
INSERT INTO SOCORRENCIA
  (CODCOLIGADA, RA, CODDISC, CODTURMA, DATA, TIPO, DESCRICAO, CODPROFESSOR, STATUS)
VALUES
  (@coligada, @ra, @codDisc, @codTurma, @data, @tipo, @descricao, @codProfessor, 'P')
```

**Cache**: invalidar ocorrências do aluno | **Perfil**: professor (create), coordenador (approve)

---

## 10. Grade Curricular

### 10.1 Matrizes por Curso

```sql
SELECT
  C.CODCURSO,
  C.NOME AS curso,
  H.CODHABILITACAO,
  H.NOME AS habilitacao,
  G.CODGRADE,
  G.NOME AS grade,
  G.ATIVO
FROM SCURSO C
INNER JOIN SHABILITACAO H ON C.CODCOLIGADA = H.CODCOLIGADA AND C.CODCURSO = H.CODCURSO
INNER JOIN SGRADE G ON H.CODCOLIGADA = G.CODCOLIGADA
  AND H.CODCURSO = G.CODCURSO AND H.CODHABILITACAO = G.CODHABILITACAO
WHERE C.CODCOLIGADA = @coligada
  AND G.ATIVO = 1
ORDER BY C.NOME, H.NOME, G.NOME
```

### 10.2 Disciplinas de uma Grade

```sql
SELECT
  GD.PERIODO,
  D.CODDISC,
  D.NOME AS disciplina,
  GD.CARGAHORARIA,
  GD.TIPO
FROM SGRADEDISC GD
INNER JOIN SDISCIPLINA D ON GD.CODCOLIGADA = D.CODCOLIGADA AND GD.CODDISC = D.CODDISC
WHERE GD.CODCOLIGADA = @coligada
  AND GD.CODGRADE = @codGrade
ORDER BY GD.PERIODO, D.NOME
```

**Cache**: long (15min) — dados estáticos | **Perfil**: todos (read)

---

## 11. Calendário Acadêmico

### 11.1 Períodos Letivos

```sql
SELECT
  PL.CODPERIODOLETIVO,
  PL.NOME,
  PL.ANO,
  PL.DATAINI,
  PL.DATAFIM,
  PL.ATIVO
FROM SPLETIVO PL
WHERE PL.CODCOLIGADA = @coligada
ORDER BY PL.ANO DESC, PL.NOME
```

### 11.2 Eventos do Calendário

```sql
SELECT
  CAL.DATA,
  CAL.TIPO,
  CAL.DESCRICAO
FROM SCALENDARIO CAL
WHERE CAL.CODCOLIGADA = @coligada
  AND CAL.DATA >= @dataIni
  AND CAL.DATA <= @dataFim
ORDER BY CAL.DATA
```

**Cache**: extended (1h) — dados raramente mudam | **Perfil**: todos (read)

---

## 12. Relatórios (via API REST TOTVS RM)

### 12.1 Listar Relatórios Disponíveis

```
GET /api/educational/v1/EducationalReports
Authorization: Basic {base64}
```

### 12.2 Gerar Relatório (PDF)

```
POST /api/educational/v1/EducationalReports/{reportId}/ViewEducationalReports
Authorization: Basic {base64}
Content-Type: application/json

{
  "CompanyCode": 2,
  "BranchCode": 1,
  "StudentRA": "2024001",
  "PeriodCode": "2026"
}
```

> **NOTA**: Esta é a ÚNICA funcionalidade que usa API REST em vez de SQL direto.
> O TOTVS RM possui um engine de relatórios nativo que gera PDFs formatados.

---

## 13. Queries de Autocomplete

### 13.1 Busca de Aluno (autocomplete)

```sql
SELECT TOP(10) A.RA, A.NOME, A.CPF
FROM SALUNO A
INNER JOIN SMATRICULA M ON A.CODCOLIGADA = M.CODCOLIGADA AND A.RA = M.RA
WHERE A.CODCOLIGADA = @coligada
  AND M.CODFILIAL = @filial
  AND (A.NOME LIKE @term + '%' OR A.RA LIKE @term + '%' OR A.CPF LIKE @term + '%')
  AND M.STATUS = 'A'
ORDER BY A.NOME
```

### 13.2 Busca de Turma (autocomplete)

```sql
SELECT TOP(10) T.CODTURMA, T.NOME, H.NOME AS serie
FROM STURMA T
LEFT JOIN SHABILITACAO H ON T.CODCOLIGADA = H.CODCOLIGADA
  AND T.CODCURSO = H.CODCURSO AND T.CODHABILITACAO = H.CODHABILITACAO
WHERE T.CODCOLIGADA = @coligada
  AND T.CODFILIAL = @filial
  AND T.CODPERIODOLETIVO = @periodoLetivo
  AND T.NOME LIKE '%' + @term + '%'
  AND T.STATUS = 'A'
ORDER BY T.NOME
```

**Cache**: short (30s) | Debounce: 300ms client-side

---

## 14. Queries de Seletor de Escola

### 14.1 Coligadas do Usuário

```sql
-- Para admin: todas
SELECT G.CODCOLIGADA, G.NOME, G.CIDADE, G.UF
FROM GCOLIGADA G
WHERE G.ATIVO = 1
ORDER BY G.NOME

-- Para usuários regulares: filtrado pelo Clerk metadata
-- (a lista vem do auth layer, não do SQL)
```

### 14.2 Filiais de uma Coligada

```sql
SELECT F.CODFILIAL, F.NOME, F.ENDERECO, F.CIDADE, F.UF
FROM GFILIAL F
WHERE F.CODCOLIGADA = @coligada
  AND F.ATIVO = 1
ORDER BY F.NOME
```

**Cache**: extended (1h) — dados raramente mudam

---

## 15. Estratégia de Cache por Tipo de Query

| Tipo | TTL | Invalidação | Exemplos |
|------|-----|-------------|----------|
| **short** | 30s | Automática | KPIs com dados em tempo real, pendências |
| **standard** | 5min | Por tag (aluno, turma, nota) | Listas, dashboards, fichas |
| **long** | 15min | Manual | Grade curricular, disciplinas |
| **extended** | 1h | Manual | Coligadas, filiais, calendário, períodos |

### Tags de Invalidação

| Tag | Quando invalidar |
|-----|-----------------|
| `aluno:{ra}` | Atualização de dados do aluno |
| `turma:{codTurma}` | Enturmação, mudança de turma |
| `nota:{ra}:{codDisc}:{codEtapa}` | Lançamento de nota |
| `freq:{codTurma}:{data}` | Registro de frequência |
| `ocorrencia:{ra}` | Nova ocorrência |
| `escola:{codColigada}` | Qualquer mudança administrativa |

---

## 16. Observações Importantes

### Nomes de Tabelas
Os nomes listados neste documento são **baseados na documentação TDN e padrões conhecidos do TOTVS RM Educacional**. Os nomes exatos devem ser confirmados executando:

```sql
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
AND TABLE_NAME LIKE 'S%'
ORDER BY TABLE_NAME;
```

### Performance
- Todas as queries de listagem usam paginação server-side (`OFFSET/FETCH`)
- Autocomplete limita a `TOP(10)`
- KPIs usam `COUNT()` com índices adequados
- JOINs complexos (Ficha do Aluno) devem ser monitorados com `SET STATISTICS IO ON`

### Segurança
- `@coligada` e `@filial` NUNCA vêm do client — injetados pelo service layer a partir da sessão
- Prepared statements em todas as queries (mssql `Request.input()`)
- Read-only flag no executor para queries SELECT
- Write operations requerem validação de perfil no service layer

### Transações
Operações de escrita que envolvem múltiplas tabelas devem usar transações MSSQL:
- Enturmação em lote
- Lançamento de notas em lote
- Registro de frequência (chamada completa)

---

## Queries Financeiras

### Parcelas por Aluno (FLAN)

```sql
SELECT
  f.IDLAN, f.RA, f.COMPETENCIA, f.DTVENCIMENTO,
  f.VALORORIGINAL, f.VALORDESCONTO, f.VALORPAGO,
  (f.VALORORIGINAL - f.VALORDESCONTO - f.VALORPAGO) AS VALORABERTO,
  CASE f.STATUSLAN
    WHEN 0 THEN CASE WHEN f.DTVENCIMENTO < GETDATE() THEN 'vencida' ELSE 'em_dia' END
    WHEN 1 THEN 'paga'
    WHEN 2 THEN 'cancelada'
  END AS STATUS,
  f.DTPAGAMENTO
FROM FLAN f
WHERE f.CODCOLIGADA = @codColigada AND f.RA = @ra
ORDER BY f.COMPETENCIA DESC;
```

### KPIs de Inadimplência

```sql
SELECT
  COUNT(DISTINCT f.RA) AS totalInadimplentes,
  SUM(f.VALORORIGINAL - f.VALORDESCONTO - f.VALORPAGO) AS totalVencido
FROM FLAN f
WHERE f.CODCOLIGADA = @codColigada
  AND f.STATUSLAN = 0 AND f.DTVENCIMENTO < GETDATE();
```

### Aging por Faixa

```sql
SELECT
  CASE
    WHEN DATEDIFF(DAY, f.DTVENCIMENTO, GETDATE()) <= 30 THEN 'ate_30'
    WHEN DATEDIFF(DAY, f.DTVENCIMENTO, GETDATE()) <= 60 THEN '31_60'
    WHEN DATEDIFF(DAY, f.DTVENCIMENTO, GETDATE()) <= 90 THEN '61_90'
    WHEN DATEDIFF(DAY, f.DTVENCIMENTO, GETDATE()) <= 180 THEN '91_180'
    ELSE 'acima_180'
  END AS faixa,
  COUNT(*) AS quantidade,
  SUM(f.VALORORIGINAL - f.VALORDESCONTO - f.VALORPAGO) AS valor
FROM FLAN f
WHERE f.CODCOLIGADA = @codColigada
  AND f.STATUSLAN = 0 AND f.DTVENCIMENTO < GETDATE()
GROUP BY CASE
    WHEN DATEDIFF(DAY, f.DTVENCIMENTO, GETDATE()) <= 30 THEN 'ate_30'
    WHEN DATEDIFF(DAY, f.DTVENCIMENTO, GETDATE()) <= 60 THEN '31_60'
    WHEN DATEDIFF(DAY, f.DTVENCIMENTO, GETDATE()) <= 90 THEN '61_90'
    WHEN DATEDIFF(DAY, f.DTVENCIMENTO, GETDATE()) <= 180 THEN '91_180'
    ELSE 'acima_180'
  END;
```

### Bolsas Ativas (SBOLSAS)

```sql
SELECT s.CODBOLSA, s.RA, s.TIPOBOLSA, s.PERCENTUAL,
  s.DTINICIO, s.DTFIM, s.ATIVA
FROM SBOLSAS s
WHERE s.CODCOLIGADA = @codColigada AND s.ATIVA = 1
ORDER BY s.RA;
```
