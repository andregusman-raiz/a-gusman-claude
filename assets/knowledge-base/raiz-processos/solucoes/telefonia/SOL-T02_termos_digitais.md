# SOL-T02 — Digitalizar Termos de Responsabilidade e Devolucao

**Processo**: Gestao de Telefonia Corporativa
**Nivel**: N1 (config nativa — Google Drive + PDF preenchivel)
**Prioridade**: Quick Win
**Timeline**: 1 dia util
**Responsavel**: Sarah (executa) | Aprovador: Maressa
**Resolve**: RC-T06 (termos nao rastreados)

---

## Descricao

Criar versoes PDF preenchaveis dos dois termos existentes e organizar em Google Drive com nomenclatura padrao. O objetivo e garantir que toda entrega gere um PDF arquivado e referenciado na planilha.

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto MEDIO — Quick Win

**Integracao com inventario**: o campo `Nr_termo_entrega` da planilha (SOL-T01) recebe o nome do arquivo PDF gerado por esta solucao.

### ROI / Impacto Esperado

| Metrica | Antes | Depois (estimado) | Melhoria |
|---------|-------|-------------------|----------|
| Termos fisicos sem backup digital | 100% | 0% | -100% |

---

## Estrutura Drive

```
Drive: Telefonia Corporativa/
├── Termos_Responsabilidade/
│   └── TERMO_RESP_[NOME]_[YYYYMMDD]_[ID_patrimonio].pdf
└── Termos_Devolucao/
    └── TERMO_DEV_[NOME]_[YYYYMMDD]_[ID_patrimonio].pdf
```

---

## Campos Minimos do Termo de Responsabilidade

- Dados do colaborador (nome, cargo, matricula, unidade)
- Descricao do bem (tipo, modelo, IMEI/ICCID/numero, ID patrimonio)
- Data de entrega
- Condicoes de uso (referencia a politica)
- Obrigacao de devolucao em N dias apos desligamento/transferencia
- Assinatura colaborador + responsavel Operacoes

---

## Plano de Implementacao

### Pre-requisitos

- Termos fisicos atuais em maos para digitalizar como modelo

### Plano Detalhado

| Atividade | Descricao |
|-----------|-----------|
| Criar PDFs preenchaveis | Usar Google Docs ou Adobe Acrobat. Campos: nome, cargo, matricula, unidade, descricao do bem, IMEI/ICCID/numero, ID patrimonio, data entrega, assinaturas. |
| Criar estrutura no Drive | Pasta "Telefonia Corporativa" → subpastas "Termos_Responsabilidade" e "Termos_Devolucao" |
| Definir nomenclatura | TERMO_RESP_[SOBRENOME]_[YYYYMMDD]_[ID].pdf e TERMO_DEV_[SOBRENOME]_[YYYYMMDD]_[ID].pdf |
| Retroativo urgente | Digitalizar termos existentes em papel (especialmente das linhas ativas) |

### Checklist de Validacao

- [ ] PDF preenchivel funciona (testar preenchimento no browser e no Acrobat)
- [ ] Pasta Drive criada com permissao de edicao para o time
- [ ] Pelo menos um termo de cada tipo arquivado como modelo
- [ ] Instrucao de nomenclatura comunicada ao time

---

## Contexto no Roadmap

**Fase 1 — Fundacao: Rastreabilidade (Semana 1)**

Independente das demais solucoes, pode rodar em paralelo com SOL-T01, SOL-T03, SOL-T04.

**Dependencias**:
```
SOL-T02 (termos digitais) ← independente, pode rodar em paralelo
```
