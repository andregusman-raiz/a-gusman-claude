# SOL-05 — Homologar Fornecedores de Assistencia Tecnica Proprias com SLA

**Processo**: Gestao de Impressoras (Locadas e Proprias) — Raiz Educacao
**Nivel**: N1 (processo + contrato — sem sistema)
**Prioridade**: Consolidacao
**Timeline**: 3-4 semanas (pesquisa + negociacao + contrato) | Prazo: 30/jun/2026
**Responsavel**: Maressa (negociacao) + Contratos/Juridico (formalizacao) | Apoio: Sarah + Samara (pesquisa)
**Resolve**: CR-04 (AT proprias sem contrato/SLA)

---

## Descricao

Selecionar e homologar 2-3 fornecedores de assistencia tecnica para impressoras proprias (por marca principal: HP, Brother, Epson etc.) com SLA contratual. Criacao de lista aprovada acessivel ao time via Tickets.

**Posicao na Matriz Impacto x Esforco**: Esforco MEDIO / Impacto MEDIO

### ROI / Impacto Esperado

| Solucao | Causa Raiz Resolvida | Impacto Esperado | Prazo |
|---------|---------------------|-----------------|-------|
| SOL-05 (AT homologada) | CR-04 | -50% tempo manutencao proprias | Jun/2026 |

---

## Criterios de Selecao de Fornecedor AT

- Autorizacao de fabricante (HP, Brother, Epson etc.) ou experiencia comprovada
- SLA: maximo 4h para escolas criticas (mecanografia), 24h para demais
- Garantia de reparo: minimo 90 dias em pecas substituidas
- Cobertura geografica na regiao necessaria
- Historico ou referencias de outros clientes educacionais

---

## Plano de Implementacao

### Pre-requisitos

- Mapa de modelos de impressoras proprias por regiao (obtido via Printwayy — SOL-01 ou planilha)
- Politica de Compras para cotacao de servicos (POL-COMP-001)
- Minuta de contrato simples de servico disponivel com Juridico

### Plano Detalhado

| Semana | Atividade | Responsavel |
|--------|-----------|-------------|
| Semana 1 | Mapear impressoras proprias: marca, modelo, quantidade, regiao (SAO, RJ, Sul, POA) | Maressa |
| Semana 1-2 | Pesquisar 2-3 fornecedores AT autorizados por marca principal (HP, Brother, Epson, Ricoh) em cada regiao | Sarah + Samara |
| Semana 2-3 | Solicitar proposta com: valor hora tecnica, SLA atendimento (meta: < 4h criticas, < 24h demais), garantia de reparo | Maressa |
| Semana 3-4 | Avaliar propostas + negociar SLA e valores | Maressa |
| Semana 4-5 | Formalizar contratos com fornecedores selecionados (1-2 por regiao) | Maressa + Juridico |
| Semana 5-6 | Cadastrar fornecedores aprovados no sistema de Tickets como opcao pre-selecionavel para categoria "Impressora Propria" | Responsavel Tickets |
| Semana 6 | Treinar time no novo fluxo: abrir ticket → selecionar fornecedor pre-aprovado → acionar | Maressa |

Passos adicionais (S_melhorias):
1. Mapear modelos de impressoras proprias por marca e regiao (base Printwayy ou planilha)
2. Pesquisar 3 fornecedores por marca-regiao (SAO, RJ, Sul, POA)
3. Negociar SLA: tempo de atendimento (< 4h para escolas criticas, < 24h demais), garantia de reparo
4. Formalizar contrato simples com SLA e valor por hora/tipo de servico
5. Cadastrar fornecedores aprovados no sistema de Tickets como opcao pre-selecionavel
6. Treinar time no novo fluxo (abrir ticket → selecionar fornecedor → acionar)

### Checklist de Validacao Pos-Go-Live

- [ ] Pelo menos 1 fornecedor homologado por regiao com contrato assinado
- [ ] Fornecedores cadastrados no sistema de Tickets
- [ ] Time treinado no novo fluxo de acionamento
- [ ] Primeiro incidente real resolvido via fornecedor homologado (teste end-to-end)
- [ ] SLA cumprido no primeiro incidente real

### Plano de Rollback

Se fornecedor homologado nao cumprir SLA nos primeiros 2 incidentes: renegociar termos ou substituir por outro fornecedor da lista de candidatos.

---

## Metricas de Sucesso

- Lista de fornecedores homologados disponivel para todas as regioes
- Tempo medio de manutencao proprias reduzido em 50% vs. baseline ad hoc

---

## Contexto no Roadmap

**Curto Prazo — Mai-Jun/2026 (Semanas 4-6)**

```
Abr/2026    Mai/2026    Jun/2026
                        SOL-05 >>>
```
