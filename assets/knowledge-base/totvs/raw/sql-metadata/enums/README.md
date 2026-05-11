# TOTVS Enums — Aviso importante

**Última atualização:** 2026-04-11 (Dia 3 diagnostic)

## Estado atual — INCOMPLETO

Os arquivos `SStatus.json`, `SCurso.json`, `STurno.json`, `STipoMatricula.json` contêm **APENAS dados de CODCOLIGADA=2**. Apenas `GColigada.json` cobre todas as 32 coligadas.

## Por que isso importa

TOTVS RM é multi-tenant por `CODCOLIGADA`. Cada coligada tem seu próprio conjunto de:
- Status de matrícula (`SStatus`)
- Cursos (`SCurso`)
- Turnos (`STurno`)
- Tipos de matrícula (`STipoMatricula`)

**Exemplo crítico — COL=10 (Escolas Integradas Raiz):**
Segundo `.claude/rules/sql-multi-db-governance.md`, COL=10 tem 3 marcas por filial com status DIFERENTES:
- FIL=1 (Qi Recreio): CODSTATUS IN (2, 3)
- FIL=3,4,6 (Sá Pereira): CODSTATUS IN (14, 15)
- FIL=7 (SAP): CODSTATUS IN (25, 32)

Os valores `14, 15, 25, 32` **NÃO existem em `SStatus.json`** porque ele só contém COL=2. Qualquer lookup programático cairá em fallback ou retornará vazio.

## O que fazer

1. **Ao consultar enum por coligada** ≠ 2, **NÃO confiar** neste KB — usar query direta ou regra codificada em `.claude/rules/sql-multi-db-governance.md`.
2. **Re-scrape completo** quando API key do Railway estiver disponível:
   ```python
   for col in range(0, 32):
       for enum in ['SStatus', 'SCurso', 'STurno', 'STipoMatricula']:
           query(f"SELECT * FROM {enum} WITH (NOLOCK) WHERE CODCOLIGADA = {col}")
   ```
3. **Consolidar** resultado em arquivos únicos contendo todas as coligadas.

## Backlog

- [ ] Abrir issue no raiz-data-engine: "Expor endpoint /admin/totvs/enums-snapshot para scrape full multi-coligada"
- [ ] Atualizar scraper em `~/Claude/projetos/totvs-scraper/src/phase1/` para iterar sobre coligadas
- [ ] Adicionar teste CI que valida presença de CODSTATUS 14, 15, 25, 32 quando COL=10 estiver no scope

## Arquivos atuais

| Arquivo | Cobertura | Linhas | Nota |
|---------|-----------|--------|------|
| `GColigada.json` | ✅ 32 coligadas (0..31) | 32 | Completo |
| `SStatus.json` | ❌ só COL=2 | 13 | Incompleto — 32 coligadas esperadas |
| `SCurso.json` | ❌ só COL=2 | 17 | Incompleto |
| `STurno.json` | ❌ só COL=2 | 20 | Incompleto |
| `STipoMatricula.json` | ❌ só COL=2 | 2 | Incompleto — 2 registros é suspeito |
