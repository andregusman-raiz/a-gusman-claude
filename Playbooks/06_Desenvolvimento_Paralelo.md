# Playbook 06: Desenvolvimento Paralelo

> Maximizar throughput sem sacrificar qualidade.

## Estrategia de Branches

```
main (producao)
├── develop (integracao)
│   ├── feature/auth-google    ← Terminal 1
│   ├── feature/chat-rooms     ← Terminal 2
│   ├── feature/dashboard      ← Terminal 3
│   ├── fix/login-timeout      ← Terminal 4
│   └── refactor/db-layer      ← Terminal 5
```

## Regras de Paralelismo

### 1. Independencia
Features paralelas devem ser independentes:
- Nao modificam os mesmos arquivos
- Nao dependem do resultado uma da outra
- Podem ser mergeadas em qualquer ordem

### 2. Merge Frequente
```bash
git fetch origin && git rebase origin/develop
```

### 3. Feature Flags (quando necessario)
```typescript
const FEATURES = {
  GOOGLE_AUTH: process.env.NEXT_PUBLIC_FEATURE_GOOGLE_AUTH === 'true',
};
```

## Workflow com 5 Terminais

| Terminal | Foco | Branch |
|----------|------|--------|
| 1 | Feature principal | feature/nome |
| 2 | Feature secundaria | feature/nome2 |
| 3 | Bug fixes | fix/descricao |
| 4 | Testes | test/cobertura |
| 5 | Docs/DevOps | docs/atualizacao |

### Coordenacao
1. **Inicio do dia**: Definir o que cada terminal fara
2. **A cada hora**: Verificar bloqueios
3. **Fim do dia**: Merge do que esta pronto, rebase do resto

## Merge Estrategico

### Ordem de Merge
1. Infraestrutura (migrations, configs)
2. Core (services, utils, types)
3. Features (componentes, paginas)
4. Testes e docs

### Se Conflito
1. Parar ambos terminais
2. Merge o mais avancado primeiro
3. Rebase o segundo
4. Resolver conflitos
5. Continuar

## Anti-Patterns

| Anti-Pattern | Solucao |
|-------------|---------|
| Branches muito longas | Merge pelo menos diario |
| Features dependentes em paralelo | Sequenciar dependencias |
| Sem rebase | Rebase diario |
| Force push em branch compartilhada | Nunca force push em shared |
