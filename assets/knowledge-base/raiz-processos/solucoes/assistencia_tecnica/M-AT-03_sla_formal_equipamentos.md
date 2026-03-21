# M-AT-03 — SLA Formal por Tipo de Equipamento com Escala de Criticidade

**Processo**: assistencia_tecnica
**Nivel**: N1
**Prioridade**: Consolidacao (P2)
**Timeline**: 2 semanas
**Responsavel**: Marissa Mello (definicao do SLA) + Sarah Firmo (implementacao no Zeev)
**Resolve**: RC-AT-04 (sem SLA formal para chamados de AT)

---

## Descricao

**RC Atacada**: RC-AT-04 (sem SLA formal para chamados de AT)
**Nivel**: N1 — Processo + configuracao Zeev
**Responsavel**: Marissa Mello (definicao do SLA) + Sarah Firmo (implementacao no Zeev)
**Prazo estimado**: 2 semanas

**O que fazer**:
Definir e publicar tabela de SLA de AT por tipo de equipamento:

| Equipamento | Criticidade | SLA Primeiro Contato | SLA Resolucao | Contingencia |
|------------|-------------|---------------------|--------------|--------------|
| Geladeira de cozinha/cantina | Alta | 4h | 24h | Locacao emergencial |
| Freezer de cantina | Alta | 4h | 24h | Locacao emergencial |
| Forno / Equip. de cocao | Alta | 4h | 48h | Cardapio alternativo |
| Lava-jato (cozinha) | Media | 24h | 72h | Contratacao manual temporaria |
| Balcao termico | Media | 24h | 72h | Suspensao de hot food |
| Micro-ondas (cozinha) | Baixa | 48h | 5 dias uteis | Sem contingencia necessaria |

**Implementacao no Zeev**:
- Campo "Tipo de Equipamento" no formulario de chamado de AT
- Zeev exibe automaticamente o SLA aplicavel para o responsavel da unidade
- Alerta automatico para Sarah se primeiro contato nao ocorreu no prazo

**Clausula em novos contratos de AT**:
Incluir SLA na formalizacao de prestadores. Prestador que descumpre SLA 3 vezes em 6 meses e descredenciado.

**Resultado esperado**:
- Unidade sabe quando esperar atendimento (elimina incerteza atual de "fica aguardando")
- Sarah tem base contratual para cobrar prestador que nao cumpriu
- Metricas disponiveis: % chamados resolvidos no SLA por prestador

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Alto |
| Esforco | Medio |
| Prioridade | P2 |
| Responsavel | Marissa + Sarah |
| Prazo | 2 semanas |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 1 — Emergencias de Controle e Compliance** (Marco - Abril 2026)
**Tarefa 1.2** no plano de implementacao (configuracao Zeev inclui SLA)

**Responsavel**: Sarah Firmo (configuracao) + Marissa (definicao de SLA)
**Prazo**: Semana de 24/marco/2026
**Dependencias**: Acesso de Sarah ao Zeev para configurar fluxo

### Passos — Configuracao do Formulario de Chamado AT no Zeev

1. Adicionar campo obrigatorio "Tipo de Equipamento" com opcoes: Geladeira/Freezer / Forno / Lava-jato / Micro-ondas / Balcao termico / Outro

2. Configurar regras de SLA automaticas:
   - Se Tipo = Geladeira/Freezer ou Forno (criticidade Alta) → SLA exibido = 4h primeiro contato / 24-48h resolucao
   - Se Tipo = Lava-jato ou Balcao termico (criticidade Media) → SLA = 24h / 72h
   - Se Tipo = Micro-ondas (criticidade Baixa) → SLA = 48h / 5 dias uteis

3. Configurar alerta para Sarah: se chamado de AT aberto e primeiro contato nao registrado dentro do SLA → email automatico para Sarah

4. Adicionar informacao de contingencia no chamado: o que a unidade deve fazer enquanto aguarda resolucao (ex: "Para geladeira: contatar Sarah para locacao emergencial")

**Criterio de conclusao**: Formulario Zeev com campo Tipo de Equipamento. SLA exibido automaticamente por tipo. Alerta de descumprimento funcionando. Teste realizado por Sarah e Marissa.

### Clausula Contratual para Novos Prestadores

Template de clausula a incluir em contratos de AT:
```
Clausula de SLA:
O prestador compromete-se a realizar o primeiro contato (resposta ao chamado) dentro dos seguintes prazos:
- Equipamentos de criticidade alta (geladeiras, freezers, fornos): 4 horas
- Equipamentos de criticidade media (lava-jatos, balcoes termicos): 24 horas
- Equipamentos de criticidade baixa (micro-ondas): 48 horas

O descumprimento do SLA em 3 ou mais chamados dentro de 6 meses resulta no descredenciamento do prestador.
```

### Metrica de Sucesso

| Metrica | Baseline | Meta 3 meses |
|--------|---------|-------------|
| Chamados AT com SLA definido | Zero | 100% |
| % chamados resolvidos dentro do SLA | Desconhecido | Mensuravel (baseline) |
| Unidades sem visibilidade de prazo | 100% | Zero |

### Dependencias Criticas

| Dependencia | Risco | Mitigacao |
|------------|-------|----------|
| Disponibilidade de Sarah para configurar Zeev | Baixo | Tarefa estimada em 3-4h; pode ser feita em 1 dia |
| Prestadores cientes do SLA | Medio | Comunicar junto com politica de NF (M-AT-02) |
