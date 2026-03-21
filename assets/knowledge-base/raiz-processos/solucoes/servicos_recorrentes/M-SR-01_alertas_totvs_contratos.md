# M-SR-01 — Alerta Automatico de Vencimento de Contratos no TOTVS

**Processo**: servicos_recorrentes
**Nivel**: N1
**Prioridade**: Quick Win (P1)
**Timeline**: 2 semanas
**Responsavel**: Sarah Firmo (execucao) + Marissa Mello (validacao)
**Resolve**: RC-SR-04 (renovacao de contratos) + RC-SR-05 (servicos especializados)

---

## Descricao

**RC Atacada**: RC-SR-04 (renovacao de contratos) + RC-SR-05 (servicos especializados)
**Nivel**: N1 — Configuracao nativa TOTVS RM
**Responsavel**: Sarah Firmo (execucao) + Marissa Mello (validacao)
**Prazo estimado**: 2 semanas

**O que fazer**:
Configurar alertas de vencimento no modulo de Contratos do TOTVS RM para todos os contratos de servicos recorrentes:
- BR Supply: 90 dias antes do vencimento
- Farmacia: 60 dias antes
- Uniformes: 90 dias antes (considerando prazo de producao)
- Material didatico extra (Bom Tempo, Innovamat, etc.): 60 dias
- Servicos especializados (Fiscalize, Ecosalva, Goni, Toca da Ciencia): 60 dias

**Como configurar no TOTVS RM**:
Modulo Contratos > Configuracoes > Alertas de Vencimento > Prazo em Dias.
Destinatarios: Sarah (primeiro alerta), Marissa (segundo alerta 30 dias depois).

**Resultado esperado**:
- Zero contratos vencendo sem processo de renovacao iniciado
- Eliminacao do risco de descontinuidade operacional (equivalente ao caso Apogeu/seguro patrimonial)

**Priorizacao**:

| Campo | Detalhe |
|-------|---------|
| Impacto | Alto |
| Esforco | Baixo |
| Prioridade | P1 |
| Responsavel | Sarah + Marissa |
| Prazo | 2 semanas |

---

## Plano de Implementacao

### Contexto do Sprint

**Sprint 1 — Wins Rapidos** (Marco - Abril 2026)
**Tarefa 1.2** no plano de implementacao

**Responsavel**: Sarah Firmo
**Prazo**: Semana de 24/marco/2026
**Dependencias**: Tarefa 1.1 (lista de contratos — M-SR-03)

### Passos

1. Acessar TOTVS RM: Modulo Gestao de Contratos
2. Para cada contrato listado em M-SR-03: verificar se esta cadastrado no TOTVS; se nao, cadastrar
3. Configurar alerta de vencimento: Contratos > Configuracoes > Alertas > Prazo de Vencimento
   - Primeiro alerta: 90 dias antes (destinatario: Sarah Firmo)
   - Segundo alerta: 60 dias antes (destinatario: Marissa Mello)
   - Terceiro alerta: 30 dias antes (destinatarios: Sarah + Marissa + Marcelle Gaudard)
4. Testar com um contrato para validar que o email chega corretamente
5. Documentar processo para manutencao futura

**Criterio de conclusao**: Todos os contratos de servicos recorrentes com alertas configurados no TOTVS. Email de teste recebido com sucesso.

### Contratos a Configurar

| Contrato | Primeiro Alerta | Destinatario Principal |
|---------|----------------|----------------------|
| BR Supply (material escritorio/copa/limpeza) | 90 dias | Sarah |
| Farmacia local | 60 dias | Sarah |
| Uniformes | 90 dias | Sarah |
| Bom Tempo (material didatico) | 60 dias | Sarah |
| Innovamat (material didatico) | 60 dias | Sarah |
| Fiscalize (servico especializado) | 60 dias | Sarah |
| Ecosalva (servico especializado) | 60 dias | Sarah |
| Goni (servico especializado) | 60 dias | Sarah |
| Toca da Ciencia (servico especializado) | 60 dias | Sarah |
| Global Tree (servico especializado) | 60 dias | Sarah |

### Metrica de Sucesso

| Metrica | Baseline | Meta 6 meses |
|--------|---------|-------------|
| Contratos com alerta de vencimento configurado | 0% | 100% |

### Dependencias Criticas

| Dependencia | Risco | Mitigacao |
|------------|-------|----------|
| Disponibilidade do TOTVS para configuracao | Baixo | Sarah com acesso direto; sem necessidade de TI |
| Lista de contratos (M-SR-03) | Baixo | Tarefa 1.1 precedente |
