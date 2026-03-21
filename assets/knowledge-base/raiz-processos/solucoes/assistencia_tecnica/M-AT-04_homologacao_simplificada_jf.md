# M-AT-04 — Homologacao Simplificada de Fornecedores Locais de AT em JF

**Processo**: assistencia_tecnica
**Nivel**: N1
**Prioridade**: Consolidacao (P2)
**Timeline**: 30-45 dias para ter 3-5 fornecedores ativos em JF
**Responsavel**: Sarah Firmo (busca e cadastro) + Fabiane Soares (aprovacao de homologacao)
**Resolve**: RC-AT-03 (JF sem fornecedores homologados)

---

## Descricao

**RC Atacada**: RC-AT-03 (JF sem fornecedores homologados)
**Nivel**: N1 — Processo simplificado de homologacao
**Responsavel**: Sarah Firmo (busca e cadastro) + Fabiane Soares (aprovacao de homologacao)
**Prazo estimado**: 30-45 dias para ter 3-5 fornecedores ativos em JF

**O que fazer**:
Criar categoria "Fornecedor Local de Pequeno Porte" com processo de homologacao simplificado:

**Criterios simplificados** (vs. processo padrao de 3 cotacoes + analise de credito + contrato formal):
- CNPJ ativo ou MEI registrado
- Referencia de pelo menos 1 cliente (qualquer empresa)
- Confirmacao de que emite NF para servicos acima de R$300 (ou justificativa de excecao para abaixo)
- Aceite dos termos basicos de servico (template simplificado de 1 pagina: escopo, prazo, valor e responsabilidade)
- Limite de contratacao sem cotacao adicional: ate R$2.000 por chamado

**Processo de busca em JF** (Sarah executa em 2 semanas):
1. Solicitar indicacoes dos proprios responsaveis de unidades JF (conhecem prestadores que ja usaram)
2. Google Maps: buscar "assistencia tecnica geladeira Juiz de Fora", "assistencia tecnica eletrodomesticos JF"
3. Ligar para 8-10 opcoes: verificar CNPJ, capacidade de NF, disponibilidade de atendimento em escolas
4. Cadastrar os 3-5 aprovados no Zeev com telefone, especialidade e regra de NF

**Categorias prioritarias para JF**:
- Assistencia tecnica de refrigeracao (geladeiras, freezers)
- Assistencia tecnica de eletrodomesticos (micro-ondas, lava-jatos)
- Manutencao hidraulica basica (complementar)

**Resultado esperado**:
- 3-5 fornecedores homologados em JF dentro de 45 dias
- Eliminacao da causa raiz que gera contratacao autonoma (RC-AT-01)
- Cadastro acessivel no Zeev para responsaveis de unidades JF consultarem diretamente

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Alto |
| Esforco | Medio |
| Prioridade | P2 |
| Responsavel | Sarah + Fabiane |
| Prazo | 45 dias (ate 15/junho/2026) |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 2 — Estruturacao de Fornecedores em JF** (Maio - Junho 2026)
**Tarefa 2.1** no plano de implementacao

**Responsavel**: Sarah Firmo (busca e pre-qualificacao) + Fabiane Soares (aprovacao formal)
**Prazo**: 15/junho/2026
**Dependencias**: M-AT-01 e M-AT-02 concluidas (fluxo Zeev ativo com flag JF)

### Passos

1. **Semana 1 (maio)**: Sarah solicita indicacoes a responsaveis de unidades JF — quem ja usaram e funcionou

2. **Semana 1**: Sarah pesquisa no Google Maps "assistencia tecnica geladeira Juiz de Fora" e "assistencia tecnica eletrodomesticos JF" — listar 8-10 opcoes

3. **Semana 2**: Sarah liga para cada opcao e aplica questionario de pre-qualificacao:
   - CNPJ ativo ou MEI? (consultar via Receita Federal)
   - Atende escolas/empresas?
   - Emite NF? Qual tipo? (para servicos acima de R$300)
   - Tem experiencia com geladeiras comerciais/lava-jactos?
   - Disponibilidade de atendimento: em quantas horas pode comparecer para urgencia?

4. **Semana 3**: Dos 8-10 contatados, selecionar 3-5 aprovados nos criterios basicos

5. **Semana 3-4**: Para os aprovados, solicitar aceite do termo simplificado de fornecedor local de pequeno porte (template de 1 pagina: escopo, prazo, valor maximo sem cotacao = R$2.000, responsabilidade)

6. **Semana 5**: Fabiane revisa e aprova formalmente

7. **Semana 6**: Sarah cadastra os aprovados no Zeev como "Prestadores AT JF" com: nome, telefone, especialidade, capacidade de NF, limite de valor sem cotacao

**Criterio de conclusao**: Minimo de 3 prestadores homologados no Zeev para AT em JF. Pelo menos 1 especialista em refrigeracao.

### Categorias Prioritarias para Busca em JF

| Categoria | Prioridade | Motivo |
|-----------|-----------|--------|
| Refrigeracao (geladeiras, freezers) | 1 — critica | Maior impacto operacional, SLA 4h |
| Eletrodomesticos gerais (micro-ondas, lava-jatos) | 2 — importante | Volume alto de chamados |
| Hidraulica basica | 3 — complementar | Demanda menor, mas recorrente |

### Template de Termo Simplificado de Fornecedor Local

```
TERMO DE FORNECEDOR LOCAL DE PEQUENO PORTE — AT
Razao social / Nome: [nome]
CNPJ / CPF / MEI: [numero]
Especialidade: [descricao]

Escopo: Servicos de assistencia tecnica em equipamentos nas unidades da [empresa] em Juiz de Fora.
Prazo de atendimento: conforme SLA definido por tipo de equipamento (documento em anexo).
Valor maximo sem cotacao adicional: R$2.000 por chamado.
Responsabilidade: O prestador e responsavel pelos danos causados durante o servico.
Documentacao fiscal: NF obrigatoria para valores acima de R$300; recibo aceito ate R$300.

Assinatura prestador: ________
Data: ________
Aprovacao interna: Fabiane Soares
```

### Metrica de Sucesso

| Metrica | Baseline | Meta 3 meses |
|--------|---------|-------------|
| Prestadores homologados em JF | Zero | 3 ou mais |
| Especialistas em refrigeracao em JF | Zero | Pelo menos 1 |
| Tempo medio de atendimento urgente em JF | Desconhecido (autonomo) | Dentro do SLA |

### Dependencias Criticas

| Dependencia | Risco | Mitigacao |
|------------|-------|----------|
| Encontrar prestadores qualificados em JF que emitam NF | Alto | Busca ampla (10 opcoes) para ter margem de selecao; aceitar MEI como alternativa valida |
| M-AT-01 concluido (fluxo Zeev com flag JF) | Medio | Executar em paralelo; cadastro no Zeev so quando fluxo estiver configurado |
