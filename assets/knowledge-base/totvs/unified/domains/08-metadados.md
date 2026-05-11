# Metadados (Introspecção)

> Tabelas de metadados do TOTVS RM — dicionário de dados, relacionamentos e códigos de módulo. Permitem descobrir schema e regras programaticamente.

---

## Tabelas

| Tabela | Descrição | Uso |
|--------|-----------|-----|
| GDIC | Dicionário de dados completo (tabelas + campos + descrições PT-BR) | Descoberta de campos |
| GCAMPOS | Versão simplificada do GDIC (tabela + campo) | Listagem rápida |
| GLINKSREL | Relacionamentos entre tabelas (FK master/child) | Mapeamento de joins |
| GSISTEMA | Códigos de módulo (S=Educacional, F=Financeiro, P=Folha, G=Global) | Classificação |

---

## Queries de Introspecção

### Listar tabelas educacionais
```sql
SELECT DISTINCT TABELA FROM GCAMPOS WHERE TABELA LIKE 'S%' ORDER BY TABELA;
```

### Campos de uma tabela
```sql
SELECT TABELA, COLUNA, DESCRICAO FROM GDIC WHERE TABELA = 'SMATRICPL' ORDER BY COLUNA;
```

### Buscar campo por descrição
```sql
SELECT TABELA, COLUNA, DESCRICAO FROM GDIC WHERE DESCRICAO LIKE '%matrícula%' ORDER BY TABELA;
```

### Foreign Keys de uma tabela
```sql
SELECT MASTERTABLE, MASTERFIELD, CHILDTABLE, CHILDFIELD
FROM GLINKSREL
WHERE MASTERTABLE = 'SALUNO' OR CHILDTABLE = 'SALUNO'
ORDER BY MASTERTABLE;
```

### Todos os relacionamentos educacionais
```sql
SELECT * FROM GLINKSREL
WHERE MASTERTABLE LIKE 'S%' OR CHILDTABLE LIKE 'S%'
ORDER BY MASTERTABLE, CHILDTABLE;
```

### Módulos de uma tabela
```sql
SELECT TABELA, APLICACOES FROM GDIC WHERE TABELA = 'SMATRICPL' AND COLUNA = '#';
-- Decodificar APLICACOES via GSISTEMA
```

---

## Regras

- GDIC e GCAMPOS são read-only — mantidos pelo TOTVS RM automaticamente
- GLINKSREL nem sempre tem TODAS as FKs — complementar com DOC-13
- GSISTEMA: S=Educacional, F=Financeiro, P=Folha, G=Global, E=Educacional Básico
