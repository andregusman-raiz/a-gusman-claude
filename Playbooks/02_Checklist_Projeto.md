# Playbook 02: Checklist de Projeto Novo

Template para inicializar um novo projeto de forma completa e consistente.

## Checklist de Inicializacao

### 1. Estrutura Base
- [ ] Repositorio Git criado
- [ ] `.gitignore` configurado
- [ ] README.md com descricao basica
- [ ] Estrutura de diretorios definida
- [ ] CLAUDE.md criado (herda do D:\CLAUDE.md)

### 2. Ambiente
- [ ] Package manager configurado (npm, pip, etc.)
- [ ] Dependencias base instaladas
- [ ] `.env.example` criado
- [ ] `.env.local` configurado para desenvolvimento
- [ ] Scripts de desenvolvimento definidos

### 3. Qualidade
- [ ] TypeScript/Linter configurado (strict quando possivel)
- [ ] Formatter configurado (Prettier, Black, etc.)
- [ ] Testes configurados (Jest, Vitest, pytest)
- [ ] Pre-commit hooks

### 4. Banco de Dados (se aplicavel)
- [ ] Banco local configurado
- [ ] Migration initial criada
- [ ] RLS ativo em todas as tabelas
- [ ] Audit trail configurado
- [ ] Seeds de dados de desenvolvimento

### 5. CI/CD
- [ ] Build funciona localmente
- [ ] Deploy configurado
- [ ] Variaveis de ambiente em staging/producao
- [ ] Pipeline de CI definido

### 6. Seguranca
- [ ] Autenticacao configurada
- [ ] CORS restritivo
- [ ] Rate limiting em endpoints sensiveis
- [ ] Security headers
- [ ] npm audit limpo (0 criticas)

### 7. Documentacao
- [ ] README com Quick Start
- [ ] Variaveis de ambiente documentadas
- [ ] Comandos principais documentados
- [ ] CLAUDE.md com convencoes do projeto

## Pos-Inicializacao
- [ ] Primeiro commit (`chore: initial project setup`)
- [ ] Branch de desenvolvimento criada
- [ ] Primeiro deploy (staging) realizado
