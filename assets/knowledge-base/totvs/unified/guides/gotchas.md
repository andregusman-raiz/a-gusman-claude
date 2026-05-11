# Gotchas e Lições Aprendidas — TOTVS RM

> Consolidação de DOC-9 + experiência dos projetos profdigital, fgts-platform, salarios-platform, raiz-platform.

---

## Conectividade

1. **~~SOAP requer VPN~~** — CORRIGIDO: SOAP funciona direto (porta 8051, Basic Auth). Ver item 33.
2. **SQL Server direto**: porta 38000 (não 1433 padrão). Firewall pode bloquear — precisa whitelist.
3. **REST funciona sem VPN** — mas apenas 7/55 endpoints retornam 200.

## Autenticação

4. **JWT expira em 5min** — a doc TOTVS diz 300s mas na prática é menos. Refresh 30s antes.
5. **Dual-token obrigatório**: JWT Bearer para REST, Basic Auth para SOAP, no MESMO app.
6. **Token de serviço**: não use token de usuário humano para apps — crie service account.

## SOAP DataServer

7. **`internalId` é composto**: `CODCOLIGADA;RA;IDPERLET` separados por `;`. Encoding errado = 404.
8. **Concorrência max 15**: TOTVS cobra por licença de conexão simultânea. Usar semáforo.
9. **Campos calculados não vêm no GetSchema**: frequência calculada, média ponderada, etc.
10. **SaveRecord exige ALL fields**: enviar apenas campos alterados causa data loss.

## SQL

11. **CODCOLIGADA em TUDO**: esquecer = cross-tenant data leak. Ver scoping automático (DOC-16).
12. **PFunc tem 524 campos**: `SELECT *` em PFunc = timeout. Sempre especificar colunas.
13. **NOLOCK recomendado**: sem NOLOCK, SELECT pode travar em tabelas grandes (lock contention).
14. **Datas em DateTime**: não Date. Comparar com `>= '2026-01-01' AND < '2026-02-01'` (não BETWEEN).

## Matrícula

15. **3 níveis de status**: Curso (SHABILITACAOALUNO), Período (SMATRICPL), Disciplina (SMATRICULA). Cada um com seu próprio CODSTATUS.
16. **Flags do SSTATUS controlam TUDO**: financeiro, acadêmico, disciplina. Mudar o status errado = cascata de efeitos.
17. **Rematrícula gera novo registro**: não é UPDATE — é INSERT em SMATRICPL + novo SCONTRATO.

## Financeiro

18. **SLAN é ponte**: SLAN (educacional) aponta para FLAN (financeiro). Não confundir os dois.
19. **Bolsa é desconto por lançamento**: SBOLSALAN aplica % em cada FLAN individualmente.

## Frequência

20. **Sem registro = Presente**: a ausência é registrada, a presença é implícita.
21. **75% mínimo é LEI** (LDB Art. 24): não é configurável, é obrigatório.

## Schema SQL vs SOAP (descoberto 2026-03-26)

25. **PFUNC tem 680 colunas no SQL** (não 524 do SOAP) — muitas duplicadas por partitioning interno. CODSECAO e CODFUNCAO existem.
26. **PFHSTFIN não existe no SQL direto** — tabela de folha detalhada tem nome diferente (possivelmente PFFINANC). SOAP DataServer expõe via PFHSTFIN mas SQL usa outro nome.
27. **PSECAO/PFUNCAO inacessíveis via SQL** — tabelas existem mas o usuário `CLT160286` não tem SELECT nelas. Usar SOAP para obter nomes de seção/função.
28. **NUMTEMPOS é campo calculado SOAP** — STURMADISC no SQL não tem NUMTEMPOS (carga horária). Disponível apenas via EduTurmaDiscData SOAP ReadView.
29. **STURMA não tem CODTURNO nem CODCURSO** — usar IDHABILITACAOFILIAL → JOIN SHABILITACAOFILIAL para obter curso/habilitação.
30. **EduMatriculaData: filtro usa `SMATRICULA.` (não `SMATRICPL.`)** — ReadView tem view interna que junta tabelas. Usar `SMATRICULA.CODCOLIGADA=2` funciona; `SMATRICPL.CODCOLIGADA=2` dá "multi-part identifier could not be bound"; `CODCOLIGADA=2` sem prefixo dá "ambiguous column name".
31. **EduContratoData: STATUS é varchar não int** — filtro `STATUS=0` dá erro de conversão. Usar `SCONTRATO.CODCOLIGADA=2` sem filtro de STATUS.
32. **Matrícula 2026 em andamento** — IDPERLET=269 (2026) tem apenas 22-168 alunos ativos em março. IDPERLET=210 (2019) tem 216. Para dados completos usar período letivo encerrado.

## Conectividade (atualizado 2026-03-26)

33. **SOAP funciona SEM VPN** — contrário ao item 1. Produção (porta 8051) aceita conexão direta com Basic Auth.
34. **SQL Server porta intermitente** — porta 38000 abre e fecha. Testar com `socket.connect_ex` antes de usar.
35. **9 DataServers SOAP confirmados**: EduBolsaData, EduContratoData, EduGradeData, EduHabilitacaoFilialData, EduMatriculaData, EduProfessorData, EduTurmaData, EduTurmaDiscData, GlbColigadaData.

## Deploy / Vercel

22. **SOAP bloqueado em Vercel**: Vercel não tem VPN. SOAP só funciona de VPS na rede TOTVS.
23. **REST funciona em Vercel**: desde que use os 7 endpoints que respondem 200.
24. **SQL bloqueado em Vercel**: mesma razão — firewall TOTVS bloqueia IPs Vercel.
