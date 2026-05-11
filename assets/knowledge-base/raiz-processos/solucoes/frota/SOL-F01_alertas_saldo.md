# SOL-F01 — Ativar Alertas Nativos de Saldo Sodexo e ConectCar

**Processo**: Gestao de Frota — Raiz Educacao
**Nivel**: N1 (configuracao nativa nos portais existentes)
**Prioridade**: Quick Win
**Timeline**: 1-2 dias uteis
**Responsavel**: Sarah Firmo (executa) + Maressa Mello (valida) + Samara Santos (acesso ConectCar)
**Resolve**: RC-F03

---

## Descricao

Ambos os portais possuem configuracao de alerta de saldo baixo nativo. O objetivo e configurar esses alertas para que o time receba notificacao automatica (email) quando o saldo de qualquer cartao Sodexo ou tag ConectCar cair abaixo de um threshold seguro, considerando o prazo de 15 dias do financeiro.

**Plataformas**:
- Sodexo: pedefacil.sodexobeneficios.com.br
- ConectCar: cliente.conectcar.com

**Posicao na Matriz Impacto x Esforco**: Esforco BAIXO / Impacto ALTO — Quick Win prioritario

### Threshold Recomendado

| Sistema | Veiculo | Threshold alerta | Justificativa |
|---------|---------|-----------------|---------------|
| Sodexo | Manutencao RJ (4 veiculos) | R$300/cartao | ~2 abastecimentos completos |
| Sodexo | Malote (2 veiculos) | R$200/cartao | Uso mais previsivel |
| Sodexo | Comercial | R$300/cartao | Uso variavel |
| ConectCar | Todos | R$150/tag | ~10 pedagogios RJ |

**Regra geral**: configurar alertas com margem para cobrir o prazo de 15 dias do financeiro.

**ROI estimado**: Elimina risco de veiculo sem combustivel ou pedagio. Custo zero (configuracao nativa).

**Riscos**:
- Portais podem nao ter alerta nativo configuravel por cartao individual (verificar na primeira sessao)
- Se nao tiver nativo: escalar para SOL-F02 (n8n consulta saldo via API ou scraping)
- ConectCar pode ter conta ProRaiz separada (CNPJ 49.218.279/0001-73 / Proraiz2024) — se sim, configurar alerta tambem

---

## Plano de Implementacao

### Pre-requisitos

- [ ] Credenciais Sodexo: gestao.utilidades@raizeducacao.com.br / Raiz@2024 (ou CONTRATOS.RAIZ@RAIZEDUCACAO.COM.BR / Raiz@2025)
- [ ] Credenciais ConectCar: CNPJ 21.219.576/0001-14 / Raiz@2024
- [ ] Lista de todos os cartoes Sodexo por veiculo (placa x cartao)
- [ ] Lista de todas as tags ConectCar por veiculo (placa x tag)

### Dia 1 — Sodexo

1. Acessar portal Sodexo com credenciais acima
2. Navegar ate "Gerenciar Cartoes" ou "Configuracoes" → localizar opcao de alerta de saldo
3. Para cada cartao de veiculo: configurar alerta quando saldo < R$300 (manutencao/comercial) ou < R$200 (malote)
4. Definir destinatarios: maressa.mello@raizeducacao.com.br + sarah.souza@raizeducacao.com.br + email do financeiro responsavel por recargas
5. Se nao houver alerta nativo por cartao: registrar como bloqueador e escalar para SOL-F02 (n8n monitora via API)
6. Registrar resultado: quais cartoes tem alerta configurado, threshold definido

### Dia 2 — ConectCar

1. Acessar portal ConectCar com credenciais acima
2. Localizar configuracao de alertas de saldo por tag
3. Para cada tag de veiculo: configurar alerta quando saldo < R$150
4. Definir destinatarios identicos ao Sodexo
5. Verificar se ConectCar tem conta ProRaiz separada (CNPJ 49.218.279/0001-73 / Proraiz2024) — se sim, configurar alerta tambem
6. Registrar resultado

### Passos adicionais (S_melhorias)

7. Registrar thresholds definidos na planilha de controle como referencia
8. Testar: verificar se alertas chegam no email correto

### Validacoes Pos-Implementacao

- [ ] Enviar email de teste verificando se alerta chega aos destinatarios corretos
- [ ] Reduzir threshold temporariamente para valor abaixo do saldo atual e confirmar disparo do alerta
- [ ] Confirmar que todos os 8 veiculos tem alerta configurado (Sodexo E ConectCar)
- [ ] Restaurar threshold correto apos teste

### Plano de Rollback

Nao ha rollback necessario — configuracao de alerta e aditiva, nao altera funcionamento existente. Para desfazer: desativar alertas nos portais.

---

## KPIs de Sucesso

| KPI | Meta |
|-----|------|
| Veiculos com alerta de saldo configurado | 8/8 (100%) |

---

## Contexto no Roadmap

**Semana 1 — Quick Wins (Dias 1-2)**

Solucao executada em paralelo com SOL-F05. Sem dependencias. Pode iniciar imediatamente apos acesso verificado aos portais.

**Posicao no plano geral**:

| # | Solucao | Responsavel | Timeline | Dependencias |
|---|---------|-------------|----------|-------------|
| 1 | SOL-F01: Alertas Sodexo/ConectCar | Sarah / Samara | Dias 1-2 | Nenhuma |
