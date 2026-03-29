# SophiA Gestão Escolar — Documentação Completa

**Data**: 2026-03-22
**Status**: Pesquisa consolidada de fontes públicas (site oficial, reviews, APIs, suporte, blog)
**Objetivo**: Referência para análise competitiva e scraping do software Sophia

---

## 1. Empresa

| Item | Detalhe |
|------|---------|
| **Razão Social** | Primasoft Informatica Ltda |
| **Nome Fantasia** | Soluções Sophia (ex-Prima Software) |
| **CNPJ** | 69.112.514/0001-35 |
| **Fundação** | 13/04/1993 |
| **Sede** | Rua Euclides Miragaia, 433, Sala 402/403 - Jd São Dimas, São José dos Campos/SP, 12.245-902 |
| **Filial** | Rua Haddock Lobo, 356, Sala 409, RJ/RJ 20260-142 |
| **Fundadores** | Eduardo Voigt e Walter Saliba |
| **Funcionários** | ~130-140 diretos |
| **Clientes** | 3.500-5.000+ instituições (Brasil e exterior) |
| **Alcance** | +1 milhão de pessoas impactadas |
| **Grupo Controlador** | Volaris Group (desde jul/2018), divisão da Constellation Software (TSX:CSU, Canadá) |
| **CNAE** | J-6202-3/00 (desenvolvimento e licenciamento de software customizável) |
| **Telefone** | (12) 2136-7200 |
| **WhatsApp Comercial** | (12) 99193-3755 |
| **E-mail Vendas** | vendas@sophia.com.br |
| **E-mail Suporte** | suporte@prima.com.br |
| **0800** | 0800 55 7074 |

---

## 2. Linha de Produtos

| Produto | Segmento | Versão |
|---------|----------|--------|
| SophiA Gestão Escolar | Fundamental, Médio e Técnico | Desktop (on-premise) |
| SophiA Gestão Escolar Web | Fundamental, Médio e Técnico | 100% Web/Cloud SaaS |
| SophiA Educação Infantil | Creches e Ed. Infantil | 100% Web |
| SophiA Gestão Acadêmica | Ensino Superior | Web |
| SophiA Cursos Livres | Escolas de cursos livres/franquias | Web (Master + Unidade) |
| SophiA Quadro de Horários (Untis) | Montagem de grades | Integrado |
| SophiA Biblioteca / Philos | Bibliotecas (escolar, universitária, cultural) | Web |
| SophiA Acervo | Museus e memória institucional | Web |
| Sophia+ by Layers | App mobile (alunos/pais/professores) | iOS + Android |
| SophiA Escolar (app legado) | App mobile | iOS + Android |
| Ana | Assistente virtual (chatbot) | Integrado ao Web |

---

## 3. Arquitetura Técnica

### Deployment Models

| Modelo | Descrição |
|--------|-----------|
| **Desktop** | Instalação local no servidor da escola (versão original) |
| **Web** | 100% browser, SaaS cloud. Ed. Infantil é exclusivamente web |
| **Mobile** | Sophia+ by Layers (iOS/Android) + SophiA Escolar (app nativo legado) |

### Stack Técnico (confirmado parcialmente)

| Aspecto | Detalhe |
|---------|---------|
| **Banco de Dados** | Oracle, SQL Server, **PostgreSQL 12+** (adicionado set/2020, open-source) |
| **Infraestrutura Cloud** | Microsoft Azure (confirmado para Philos/Biblioteca, SLA 99.8%) |
| **API** | REST própria (JSON e XML), 18 recursos |
| **App Mobile** | Sophia+ by Layers (parceria Layers Edtech, set/2022) |
| **Site Institucional** | WordPress + Elementor |
| **Backups** | Automáticos (versão web) |
| **Atualizações** | Automáticas (versão web) |
| **Sem limite de usuários simultâneos** | Diferencial mencionado no marketing |

---

## 4. Módulos Detalhados

### 4.1 Secretaria / Administrativo

- Prospecção e captação de alunos (funil de vendas)
- Matrícula e rematrícula online
- Geração de contratos (integração Microsoft Word)
- Assinatura eletrônica via **ClickSign**
- Envio de e-mails em massa
- Integração com **RD Station** (CRM/marketing)
- Gestão multi-unidade
- Perfis de acesso por função
- Ficha individual do aluno
- Histórico escolar (customizável via gerador de documentos)
- Declarações e atestados
- Ficha de saúde
- Central do aluno
- Ocorrências
- Autoatendimento: alunos/responsáveis editam dados cadastrais

### 4.2 Financeiro

- Dashboard financeiro com alertas de vencimentos
- Contas a pagar e a receber
- Geração de boletos em lote
- Desconto condicional (válido até data específica)
- Cobrança recorrente por cartão de crédito (sem comprometer limite total)
- PIX e transferência bancária
- Integração bancária automatizada (liquidação automática de títulos)
- Emissão de NFS-e (Florianópolis, Campinas, RJ, SP)
- Emissão de NF de produto
- Integração com sistemas contábeis
- Relatório de fluxo de caixa
- Relatório de contas recebidas por colaborador
- Declaração anual de pagamentos (para IR)
- **Régua de Cobrança automatizada**: notificações por e-mail em cada fase, mensagens personalizáveis
- Renegociação de dívidas
- Integração com WhatsApp Web para comunicação financeira

### 4.3 Pedagógico / Acadêmico

- **Ferramenta Professor**: lançamento de notas, conteúdos, faltas, tarefas, ocorrências via web
- Acompanhamento de desempenho: individual, por turma ou disciplina
- Diário de classe digital (geração automática com frequência)
- Boletim com cálculo automático de notas e frequência
- Dois processos de boletim: automático (Fund. II e Médio) e manual (Ed. Infantil e Fund. I)
- Avaliações descritivas (parecer descritivo)
- Classificação por emojis (Educação Infantil)
- Histórico escolar com disciplinas associadas a áreas BNCC
- Calendário escolar
- Dias letivos e frequência detalhada
- Deveres de casa e tarefas
- Monitoramento de acesso de alunos/responsáveis aos materiais publicados
- Fichas médicas (medicamentos, tratamentos, restrições alimentares, contatos emergência)

### 4.4 Portal do Aluno (Terminal Web)

- 100% web, integrado ao gerenciador
- Visualização de avisos
- Ficha financeira e emissão de boletos
- Relatórios demonstrativos de pagamento
- Boletim de notas e parecer descritivo
- Atualização de dados cadastrais pelo próprio aluno/responsável
- Download de arquivos de aulas
- Rematrícula online
- Personalização visual (cor, fonte, logotipos da escola)

### 4.5 Portal/Ferramenta do Professor

- Lançamento de notas por turma/disciplina
- Registro de frequência/faltas
- Registro de conteúdos didáticos ministrados
- Distribuição de tarefas
- Registro de ocorrências disciplinares
- Acompanhamento individualizado de alunos
- Monitoramento de acesso ao material publicado

### 4.6 Sophia+ by Layers (App Mobile — 13 funcionalidades)

1. Agenda/calendário escolar digital
2. Feed de comunicados com fotos e relatórios
3. Chat de atendimento em tempo real
4. E-commerce (vendas online, cobrança recorrente, matrículas)
5. Ficha médica (plano de saúde, alergias, medicamentos)
6. Notas (avaliações por disciplina, múltiplos modelos)
7. Ocorrências acadêmicas em tempo real
8. Grade horária unificada
9. Visão financeira consolidada (mensalidades + materiais)
10. Links rápidos (redes sociais, arquivos, lojas — com níveis de permissão)
11. Acompanhamento de conteúdo em sala para pais
12. Percentual de frequência por disciplina
13. Diário do professor (faltas, ocorrências, conteúdo)

Funcionalidade especial: **"Filho Sem Fila"** (controle de saída escolar)

### 4.7 Quadro de Horários (Untis)

- Algoritmo de otimização automática
- Suporte a 1-4 semanas diferentes
- Drag-and-drop de disciplinas
- Verificação de conflitos
- 70+ checkpoints diagnósticos
- Colaboração simultânea entre equipes
- Otimização de salas, laboratórios e docentes

### 4.8 Estoque

- Cadastro de kits escolares (apostilas, livros, materiais)
- Condições de pagamento exclusivas por kit
- Recebimento de pedidos (fornecedor, data)
- Ajuste de estoque (perdas, danos, furtos, vencimentos)
- Emissão de NF com cálculo tributário
- Permite vendas com estoque zerado

### 4.9 Processo Seletivo / Captação

- Administração de concursos de admissão e bolsas
- Ferramenta de prospecção com funil de vendas
- Dashboard de captação (matrículas por campanha, por colaborador, perdas por motivo)
- Integração com RD Station
- Envio de e-mails em lote para prospects
- Avaliação Institucional (pesquisas de satisfação — versão Ensino Superior)

### 4.10 Biblioteca / Philos

- Catalogação simplificada com importação automática via ISBN
- Gestão de acervo híbrido (físico + digital)
- Terminal de usuário: consulta, reservas, renovações
- Circulação com relatórios estatísticos
- Sistema de categorização por cores
- Controle de perfis com permissões granulares
- Envio de e-mails personalizados
- Dashboard estatístico: fluxo de circulação, tendências de empréstimo, títulos populares
- Hospedado em Microsoft Azure, SLA 99.8%
- **6-7x campeão consecutivo** no Prêmio Top Educação

### 4.11 Relatórios

- Relatórios financeiros (inadimplência, fluxo de caixa, contas a receber/pagar, demonstrativos)
- Relatórios acadêmicos (boletins, históricos, desempenho por turma/disciplina)
- Dashboard comercial de captação
- Estatísticas de biblioteca
- Relatórios configurados por escola
- Dados para tomada de decisão baseada em indicadores reais

### 4.12 Educação Infantil (módulo específico)

- 100% web, sem versão desktop
- Avaliações descritivas: cognitivo, socioemocional, físico
- Sistema de avaliação com emojis (interativo, child-friendly)
- Frequência por estágio ou diária
- Boletins descritivos
- Fichas médicas completas
- Multi-unidade
- Contrato personalizado de matrícula
- Boleto múltiplo (vários filhos com mesmo responsável)

### 4.13 Cursos Livres / Franquias

- **SophiA Master** (franqueadora): visão consolidada da rede, padronização
- **SophiA Unidade** (franqueados): gestão local
- Metas de equipe e promoção de matrículas
- Terminal Web para rematrícula online
- Cliente destaque: **Método Supera**

---

## 5. API de Integração

### Visão Geral

A "API Web de Integração SophiA" possui **18 recursos**:
autenticação, avisos, boletins, calendário, campanhas, cursos, finanças, logotipos, notas, pessoas, prospectivos, versão, usuário + outros.

### Autenticação

- **Endpoint**: `GET /api/autenticacao`
- **Formato**: JSON ou XML (header `Content-Type` e `Accept`)
- **Headers obrigatórios**: `User-Agent`, `Host`, `Content-Type`, `Accept`, `Token`
- **Token vinculado ao IP** do equipamento requisitante
- **Token renovado a cada request**
- **Expira após 20 minutos** de inatividade
- HTTP 200 = sucesso (retorna Token), HTTP 401 = credenciais inválidas

### Endpoints Conhecidos

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/api/autenticacao` | Autenticação e geração de token |
| GET | `/api/versao` | Versão da API |
| GET | `/api/usuario/{identificacao}` | Dados de usuário |
| — | `/api/avisos` | Avisos/comunicados |
| — | `/api/boletins` | Boletins de notas |
| — | `/api/calendario` | Calendário escolar |
| — | `/api/campanhas` | Campanhas de matrícula |
| — | `/api/cursos` | Cursos |
| — | `/api/financas` | Dados financeiros |
| — | `/api/logotipos` | Logotipos da escola |
| — | `/api/notas` | Notas/avaliações |
| — | `/api/pessoas` | Alunos, responsáveis, professores |
| — | `/api/prospectivos` | Leads/prospects |

### Dados sincronizados via integração (confirmado Diário Escola)

Anos letivos, unidades, cursos, turmas, disciplinas, alunos, responsáveis, professores, boletins de notas, boletos financeiros.

### Documentação da API

- **PDF oficial (Biblioteca/Philos)**: [IFB - API Web de Integração](https://ifb.edu.br/attachments/article/39100/API%20Web%20de%20Integra%C3%A7%C3%A3o.pdf)
- **PDF Gestão Escolar (restrito)**: [Scribd - Integração API Web SophiA 1.0](https://www.scribd.com/document/592604325/Integracao-API-Web) (autor: Paulo Vitor Nascimento)
- **IMPORTANTE**: Ativação da API pode ter **custo adicional**. Precisa ser negociada com Sophia.

---

## 6. Integrações Confirmadas

| Parceiro | Tipo | Detalhe |
|----------|------|---------|
| **Principais bancos brasileiros** | Financeiro | Liquidação automática, boletos |
| **Sistemas contábeis** | Financeiro | Exportação de dados |
| **Microsoft Word** | Documentos | Templates para contratos |
| **ClickSign** | Assinatura | Assinatura eletrônica |
| **RD Station** | Marketing | Automação de funil de captação |
| **WhatsApp Web** | Comunicação | Mensagens e notificações |
| **Diário Escola** | Acadêmico | Dados acadêmicos + boletos via superApp |
| **Agenda Edu** | Comunicação | Sync via API (requer ativação) |
| **Foreducation EdTech** | Google for Education | Integração sem recadastro |
| **Odilo** | Conteúdo digital | Plataforma tipo Netflix educacional |
| **Untis** | Grade horária | Software de montagem de horários |
| **Layers Edtech** | Mobile | Sophia+ by Layers (superApp) |
| **Web API REST** | Custom | JSON/XML para integrações terceiras |

---

## 7. Modelo Comercial

- **Preço NÃO divulgado publicamente** — sob consulta
- **Modelo modular**: escola adquire apenas os módulos necessários
- **Sem limite de operadores simultâneos**
- **API tem custo adicional**: ativação de APIs pode gerar cobrança extra
- **Cobranças extras reportadas**: importação de dados, treinamentos obrigatórios, reajustes
- **Implantação**: instalação, treinamento e configuração incluídos

---

## 8. Premiações

| Ano | Prêmio | Categoria | Resultado |
|-----|--------|-----------|-----------|
| 2015 | Top Educação | Software para Bibliotecas | 1ª vitória |
| 2016-2021 | Top Educação | Software para Bibliotecas | Vitórias consecutivas (7x) |
| 2020 | Top Educação | Software Gestão Educacional (Superior) | Vencedor |
| 2021 | Top Educação | 4 categorias | Vencedor em múltiplas |
| 2023 | Top Educação | Concorrendo | Status não confirmado |

---

## 9. Comparação com Concorrentes

| Critério | SophiA | TOTVS Educacional | Sponte | Proesc | iScholar | WPensar |
|----------|--------|-------------------|--------|--------|----------|---------|
| **Fundação** | 1993 | — | ~2000 | — | ~2010 | — |
| **Clientes** | 3.500-5.000 | — | 5.000+ | 3.500+ | — | — |
| **Porte alvo** | Todos | Médio-grande | Todos | Todos | Todos | Pequeno-médio |
| **Ed. Infantil** | Sim (100% web) | Sim | Sim | Sim | Sim | Sim |
| **Ensino Superior** | Sim (premiado) | Sim | Não | Não | Não | Não |
| **Biblioteca** | Líder (7x premiado) | Não | Não | Não | Sim (digital) | Não |
| **App Mobile** | Sophia+ (Layers) | Portal web | Próprio | Próprio | Próprio | Próprio |
| **CRM integrado** | RD Station | Não | Nativo | — | — | — |
| **Franquias** | Sim (Master/Unidade) | Não | Não | Não | Não | Não |
| **Controlador** | Volaris/CSI (Canadá) | TOTVS S.A. (B3) | — | Investido (R$8M) | — | — |
| **Força** | Bibliotecas, modularidade, 30+ anos | Robustez, ERP, escala | CRM, intuitividade | Ecossistema, 7 países | BI/dashboards | Simplicidade |
| **Fraqueza** | Suporte, UX, estabilidade | Complexidade, custo | — | — | — | — |

---

## 10. Avaliações e Reputação

### Pontos Fortes (usuários)
- 30+ anos de mercado, base instalada significativa
- Premiação Top Educação (vencedor múltiplo)
- Modularidade (compra módulos avulsos)
- Ecossistema de integrações (Layers, Diário Escola, Agenda Edu, Google)
- Respaldo de grupo internacional (Volaris/Constellation)

### Pontos Fracos (Reclame Aqui e reviews)
- **Suporte técnico**: consistentemente criticado como lento e despreparado
- **Interface**: descrita como "pouco intuitiva" por usuários
- **Instabilidade**: travamentos, indisponibilidade, recálculos que não completam
- **Implementação**: escola recebe treinamento genérico online, fica sozinha depois
- **Cobranças extras**: importação de dados (R$ 3.600), treinamentos obrigatórios, APIs
- **Reclame Aqui**: reputação "Sem Índice" — poucos casos resolvidos publicamente

---

## 11. URLs e Recursos Oficiais

### Site Principal
- https://sophia.com.br
- https://sophia.com.br/solucoes/instituicoes-de-ensino/sophia-gestao-escolar/
- https://sophia.com.br/solucoes/instituicoes-de-ensino/educacao-basica/
- https://sophia.com.br/solucoes/instituicoes-de-ensino/educacao-infantil/
- https://sophia.com.br/solucoes/instituicoes-de-ensino/ensino-superior/

### Área do Cliente e Portais
- https://cliente.sophia.com.br/area-cliente (login)
- https://escolar.sophia.com.br/Portal/{id}/login (Portal do Aluno)
- https://escolar.sophia.com.br/Gerenciador/{id}/login (Gerenciador)

### Base de Conhecimento / Suporte (OFICIAL)
- https://suporte.sophia.com.br/bc/SG/SGE/index.html (Knowledge Base SGE)
- https://suporte.sophia.com.br/bc/SG/SGE/Historico.pdf (Histórico Escolar)
- https://suporte.sophia.com.br/bc/SG/SGE/Ficha%20individual.pdf (Ficha Individual)
- https://suporte.sophia.com.br/bc/SG/SGE/Fluxo%20de%20caixa.pdf (Fluxo de Caixa)
- https://suporte.sophia.com.br/bc/sg/sga/2_-_sobre_o_suporte.htm (Sobre o suporte)

### Treinamento (EBE Online LMS)
- https://ebeonline.com.br/course-category/secretaria-secretaria-2/ (Secretaria — 9 cursos)
- https://ebeonline.com.br/course-category/pedagogico/ (Professor)
- https://ebeonline.com.br/course-category/sophia-pedagogico/ (Coordenação)
- https://ebeonline.com.br/course-category/financeiro-financeiro-3/ (Financeiro — 2 cursos)

### Apps Mobile
- https://play.google.com/store/apps/details?id=education.layers.sophiabylayers (Sophia+)
- https://apps.apple.com/br/app/sophia-by-layers/id6443421620 (Sophia+ iOS)
- https://play.google.com/store/apps/details?id=com.intuitiveappz.sophiaPadrao (SophiA Escolar)
- https://apps.apple.com/br/app/sophia-escolar/id979794793 (SophiA Escolar iOS)

### Redes Sociais
- YouTube: https://www.youtube.com/@solucoessophia
- Instagram: https://www.instagram.com/solucoessophia/
- Facebook: https://www.facebook.com/solucoessophia/
- LinkedIn: https://br.linkedin.com/company/solucoessophia

### Documentação API
- [API Biblioteca/Philos (PDF público - IFB)](https://ifb.edu.br/attachments/article/39100/API%20Web%20de%20Integra%C3%A7%C3%A3o.pdf)
- [Descritivo Funcional Biblioteca Web (PDF - IFB)](https://www.ifb.edu.br/attachments/article/39100/Descritivo%20Funcional%20do%20Sophia%20Biblioteca%20Web.pdf)
- [Manual Sophia Biblioteca (PDF - IFG)](https://www.ifg.edu.br/attachments/article/650/SOPHIA-Sistema-de-Biblioteca-versao-1.4--05-10-2017.pdf)
- [API Gestão Escolar (restrito - Scribd)](https://www.scribd.com/document/592604325/Integracao-API-Web)

---

## 12. Release Notes (parcial)

A Sophia usa sistema de **Builds**:

| Build | Data | Novidades |
|-------|------|-----------|
| **22** | Fev | Desconto condicional, boletos otimizados, homologação bancária customizável |
| **23** | Mar | E-mail direto do sistema, envio de boletos nativo, relatório por colaborador, declaração anual de pagamentos, NFS-e (4 cidades), Web API para app e integrações |

Não há changelog público formal. Novidades via blog posts.

---

## 13. Lacunas na Documentação Pública

Os seguintes itens **NÃO foram encontrados** publicamente:

- Schema/modelo de banco de dados completo
- Documentação completa da API com todos os endpoints e payloads
- SDK ou biblioteca cliente
- Webhooks ou eventos em tempo real
- Rate limits da API
- Swagger/OpenAPI spec
- Ferramentas de migração de dados (import/export em massa)
- Código-fonte ou repositórios públicos
- Guia de implementação técnica detalhado

> A Sophia opera como software proprietário fechado, com documentação técnica disponibilizada apenas para clientes via suporte.

---

## 14. Mapeamento Sophia ↔ TOTVS RM (referência cruzada)

Para facilitar comparação com a KB do TOTVS RM já documentada:

| Domínio | Sophia | TOTVS RM |
|---------|--------|----------|
| Alunos | `/api/pessoas` | SALUNO |
| Matrículas | Matrícula/rematrícula online | SMATRICULA |
| Turmas | `/api/cursos` (parcial) | STURMA |
| Disciplinas | Ferramenta Professor | SDISCIPLINA, STURMADISC |
| Notas | `/api/notas`, `/api/boletins` | SNOTA |
| Frequência | Diário de classe, chamada | SFALTA |
| Financeiro | `/api/financas` | FLAN |
| Calendário | `/api/calendario` | SCALENDARIO, SPLETIVO |
| Ocorrências | Ocorrências (portal/app) | SOCORRENCIA |
| Multi-tenant | Multi-unidade (escola) | CODCOLIGADA + CODFILIAL |
| Professores | Ferramenta Professor | SPROFESSOR, STURMADISC |
| Responsáveis | Portal do Aluno | SRESPONSAVEL |
| Grade curricular | Quadro de Horários (Untis) | SCURSO → SHABILITACAO → SGRADE |
| Biblioteca | Philos (produto separado) | N/A (TOTVS não tem módulo nativo) |
| Bolsas | Financeiro (parcial) | SBOLSAS |
| Documentos | Gerador + Word + ClickSign | API REST relatórios |
