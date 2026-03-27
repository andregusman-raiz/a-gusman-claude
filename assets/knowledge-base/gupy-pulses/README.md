# Gupy / Pulses — API Reference

> Fonte: https://developers.gupy.io/
> Pulses Developers: https://developers.pulses.com.br/
> Atualizado: 2026-03-21

## Visao Geral

Gupy é a plataforma de gestão de pessoas usada pela Raíz Educação.
Pulses (agora Gupy Clima e Engajamento) faz pesquisas de clima organizacional.

## Autenticação

- JWT Bearer Token (primário)
- Firebase (alternativo)
- Admin Global (acesso system-wide)
- SAML: OneLogin, AD FS, Azure, KeyCloak

## Produtos / Módulos API

### 1. Recrutamento e Seleção (R&S)
- Jobs: CRUD, status, quick-apply com custom fields
- Applications: listar, criar, mover candidatos, convidar, tags
- Webhooks: candidato contratado, movimentação
- Career page integration
- Diversity data extraction

### 2. Admissão
- Fluxo admissão → folha de pagamento
- Download de documentos
- Integração exame médico (ASO)
- Provisioning de equipamentos
- Integração com contrato
- **Conectores payroll**: RM TOTVS, Metadados, Sênior, ADP, Protheus

### 3. Treinamento
- Integração de usuários
- Integração de grupos

### 4. Engajamento / Clima (Pulses)
- **Colaboradores**: CRUD completo
- **Grupos**: gerenciamento
- **Instrumentos**: consulta de instrumentos de pesquisa
- **Feedbacks**: consulta de feedbacks
- **Caixa de Sugestões**: consulta com filtros
- **Scores**: consulta de scores, heatmap, scores agregados

### 5. Admin Global
- Posições: CRUD
- Colaboradores: listar, criar, deletar, atualizar, buscar por ID

## API Versions
- v1.0 e v2.0 disponíveis

## Docs Completa
- Developer Hub: https://developers.gupy.io/
- Pulses API: https://developers.pulses.com.br/
- Clima e Engajamento: https://developers.gupy.io/docs/produto-clima-e-engajamento
