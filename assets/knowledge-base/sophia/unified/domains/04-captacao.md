# Captação e Processo Seletivo

> Funil de matrículas novas: campanha → processo seletivo → contratação → finalização.

---

## Tags da API (6)

`Campanha`, `Contratacao`, `Finalizacao`, `Processo`, `ProcessoSeletivo`, `ResumoContratacao`

## Endpoints (14)

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/api/v1/ProcessoSeletivo/inscricao` |  |
| GET | `/api/v1/rematricula/Campanha` |  |
| GET | `/api/v1/rematricula/{idOferta}/Contratacao/{idMatricula}` |  |
| POST | `/api/v1/rematricula/{idOferta}/Contratacao/{idMatricula}` |  |
| GET | `/api/v1/rematricula/{idOferta}/Finalizacao` |  |
| GET | `/api/v1/rematricula/{idOferta}/Processo` |  |
| POST | `/api/v1/rematricula/{idOferta}/ResumoContratacao/{idMatricul` |  |
| POST | `/{tenant}/api/v1/ProcessoSeletivo/inscricao` |  |
| GET | `/{tenant}/api/v1/rematricula/Campanha` |  |
| GET | `/{tenant}/api/v1/rematricula/{idOferta}/Contratacao/{idMatri` |  |
| POST | `/{tenant}/api/v1/rematricula/{idOferta}/Contratacao/{idMatri` |  |
| GET | `/{tenant}/api/v1/rematricula/{idOferta}/Finalizacao` |  |
| GET | `/{tenant}/api/v1/rematricula/{idOferta}/Processo` |  |
| POST | `/{tenant}/api/v1/rematricula/{idOferta}/ResumoContratacao/{i` |  |

---

## Regras

- Processo seletivo = vestibular/seleção (CRM de captação)
- Campanha = marketing para captar candidatos
- Contratação = formalização da matrícula (gera contrato financeiro)
- Não existe equivalente direto no TOTVS RM (TOTVS não tem CRM de captação nativo)

*Swagger completo em `raw/swagger-sophia-v1.json`*
