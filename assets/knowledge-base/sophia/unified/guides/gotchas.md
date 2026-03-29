# Gotchas — SophiA Gestão Escolar

---

## Autenticação
1. **Token expira em 20min** — refresh automático obrigatório
2. **Token vinculado ao IP** — mudança de IP (VPN, deploy) exige novo login
3. **API é recurso PAGO** — ativação por escola tem custo adicional
4. **Credenciais são de parceiro** — não de usuário final (usuario_parceiro + senha)

## API
5. **Cada escola tem instância separada** — URL: `{escola}.sophia.com.br/api/v1`
6. **Swagger no portal é REFERÊNCIA** — API real roda na instância da escola
7. **JSON e XML** — Accept header determina formato. Usar JSON.
8. **Paginação offset-based** — `?pagina=1&registros=50` (diferente de cursor do HubSpot)
9. **111 endpoints documentados no Swagger** mas contagem real é 258 (múltiplos methods por path)

## Dados
10. **CodigoAluno ≠ RA (TOTVS)** — identificadores diferentes entre sistemas
11. **Responsável tem flag financeiro/pedagógico** — um responsável pode ser ambos
12. **Processo seletivo é CRM de captação** — não existe no TOTVS RM
13. **Catraca é físico** — integração com hardware de controle de acesso

## Cross-Reference TOTVS RM
14. **Alunos → SALUNO**, Matrículas → SMATRICULA, Turmas → STURMA
15. **Notas → SNOTAETAPA**, Frequência → SFREQUENCIA, Contratos → SCONTRATO
16. **Captação não tem equivalente TOTVS** — módulo exclusivo Sophia

## Frontend (sophia-educacional-frontend)
17. **Mock-first** — frontend pronto com mock data, aguardando API real
18. **208 files, 70 pages** — 5 módulos (Secretaria, Pedagógico, Financeiro, Captação, Régua Cobrança)
19. **Porta 3004** — fixa no workspace
