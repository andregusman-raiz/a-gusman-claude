# M-AT-01 — Stop Emergencial em JF: Chamado Obrigatorio Antes de Qualquer Conserto

**Processo**: assistencia_tecnica
**Nivel**: N1
**Prioridade**: Quick Win (P1)
**Timeline**: Imediato (comunicado em 1 semana; processo ativo em 2 semanas)
**Responsavel**: Marissa Mello (comunicado) + gestores de unidades JF (execucao)
**Resolve**: RC-AT-01 (JF contrata por conta propria)

---

## Descricao

**RC Atacada**: RC-AT-01 (JF contrata por conta propria)
**Nivel**: N1 — Processo + comunicado formal
**Responsavel**: Marissa Mello (comunicado) + gestores de unidades JF (execucao)
**Prazo estimado**: Imediato (comunicado em 1 semana; processo ativo em 2 semanas)

**O que fazer**:
1. Marissa emite comunicado formal a todos os responsaveis de unidades JF: a partir de [data], nenhum conserto de equipamento pode ser contratado sem abertura de chamado no Zeev e aprovacao de Contratos/Suprimentos.
2. Criar no Zeev fluxo de chamado de AT com campo obrigatorio "Regiao: JF". Se JF, chamado e roteado para Sarah (Contratos) para validar prestador antes de autorizar.
3. Regra de urgencia: Sarah tem alca de aprovacao emergencial de ate R$500 sem cotacao; acima disso, mini-cotacao com 2 fornecedores em ate 24h (uso do cadastro de homologados — ver M-AT-04).
4. Regra de NF: todo prestador confirmado responde antes do inicio do servico se emite NF.

**Comunicado deve incluir explicitamente**:
- Motivo: controle de custos, compliance fiscal, rastreabilidade
- Como abrir chamado: link Zeev (comunicado inclui QR code ou link direto)
- Consequencia: despesa sem chamado nao sera lancada pela empresa

**Resultado esperado**:
- Zeramento do desvio de contratacao autonoma em JF em ate 30 dias
- Todos os custos de AT de JF visiveis no orcamento central
- Base para construcao do banco de fornecedores locais homologados (M-AT-04)

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Alto |
| Esforco | Baixo |
| Prioridade | P1 |
| Responsavel | Marissa + Sarah |
| Prazo | 2 semanas |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 1 — Emergencias de Controle e Compliance** (Marco - Abril 2026)
**Tarefa 1.1** (comunicado) e **Tarefa 1.2** (configuracao Zeev)

### Tarefa 1.1 — Emitir Comunicado Formal de Stop em JF

**Responsavel**: Marissa Mello
**Prazo**: Semana de 17/marco/2026 (imediato)
**Dependencias**: Nenhuma

**Passos**:
1. Marissa elabora comunicado formal direcionado a todos os responsaveis de unidades JF:
   - Assunto: [OPERACAO JF] Assistencia Tecnica — Novo Processo Obrigatorio
   - Conteudo: A partir de [data], nenhum conserto de equipamento pode ser contratado sem abertura de chamado no Zeev e aprovacao de Contratos (Sarah Firmo). Despesas sem chamado nao serao lancadas pela empresa.
   - Incluir: link do formulario Zeev de chamado de AT (ou instrucoes para abrir o chamado)
2. Marissa envia para responsaveis de JF e copia Marcelle Gaudard
3. Marissa confirma recebimento com cada responsavel (resposta de acknowledgment)

**Criterio de conclusao**: Comunicado enviado e confirmado por todos os responsaveis de JF.

### Tarefa 1.2 — Configurar Fluxo Zeev para Chamado de AT com Flag JF (parte do M-AT-01 + M-AT-03)

**Responsavel**: Sarah Firmo (configuracao) + Marissa (definicao de SLA)
**Prazo**: Semana de 24/marco/2026
**Dependencias**: Tarefa 1.1 concluida; acesso de Sarah ao Zeev para configurar fluxo

**Passos — Configuracao do formulario de chamado AT no Zeev**:
1. Adicionar campo obrigatorio "Tipo de Equipamento" com opcoes: Geladeira/Freezer / Forno / Lava-jato / Micro-ondas / Balcao termico / Outro
2. Adicionar campo "Regiao/Unidade" (verificar se JF ja esta identificado)
3. Configurar regra: se Tipo = Geladeira/Freezer ou Forno (criticidade alta) -> SLA exibido no chamado = 4h primeiro contato / 24h resolucao
4. Configurar regra: se Tipo = Lava-jato ou Balcao termico -> SLA = 24h / 72h
5. Configurar regra: se Tipo = Micro-ondas -> SLA = 48h / 5 dias uteis
6. Configurar alerta para Sarah: se chamado de AT aberto e primeiro contato nao registrado dentro do SLA -> email automatico

**Passos — Regra especial JF**:
7. Adicionar campo "Ja tem prestador sugerido?": se JF e campo vazio -> chamado vai para Sarah para indicar prestador do cadastro homologado
8. Alca de emergencia: Sarah pode aprovar ate R$500 sem cotacao para urgencias de geladeira/forno em JF

**Criterio de conclusao**: Formulario Zeev atualizado. SLA exibido automaticamente. Alerta de descumprimento funcionando. Teste realizado por Sarah e Marissa.

### Metrica de Sucesso

| Metrica | Baseline | Meta 1 mes | Meta 3 meses |
|--------|---------|-----------|-------------|
| Contratacoes AT JF sem chamado | Recorrente | Zero | Zero |
| Custo AT JF visivel no orcamento | Nao | Sim (pelo menos parcial) | 100% visivel |

### Dependencias Criticas

| Dependencia | Risco | Mitigacao |
|------------|-------|----------|
| Adocao do processo pelas unidades JF (abertura de chamado) | Alto | Comunicado formal + consequencia financeira (despesa nao lancada) + acompanhamento semanal nas primeiras 4 semanas |
| Disponibilidade de Sarah para configurar Zeev | Baixo | Tarefa estimada em 3-4h; pode ser feita em 1 dia |
