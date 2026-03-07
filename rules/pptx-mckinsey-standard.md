# PPTX McKinsey Standard — Qualidade Visual

## Design System (obrigatorio antes de gerar)

Toda apresentacao DEVE definir paleta + tokens antes de qualquer codigo:
```python
PALETTE = {
    'primary': 'HEXCOR', 'secondary': 'HEXCOR', 'dark': 'HEXCOR',
    'light': 'HEXCOR', 'accent': 'HEXCOR',
    'text_dark': '333333', 'text_mid': '666666', 'text_light': '999999',
    'danger': 'E74C3C', 'success': '27AE60',
}
```
Apresentar ao usuario e esperar aprovacao ANTES de gerar.

## Variety Calendar

### Minimos obrigatorios de tipos de layout
| Total slides | Min tipos |
|-------------|-----------|
| 5-10        | 3         |
| 11-20       | 5         |
| 21-35       | 7         |
| 36-50       | 9         |
| 50+         | 10+       |

### Regra dos 2 consecutivos
NUNCA o mesmo tipo de layout mais que 2 slides seguidos.

### Catalogo de layouts
| ID | Layout | Quando usar |
|----|--------|-------------|
| A  | Capa | Primeiro slide |
| B  | Agenda com badges | Segundo slide |
| C  | Section divider (split rico) | Transicao entre secoes |
| D  | Grid 2x2 com cards | 3-4 pontos paralelos |
| E  | Grid 3x colunas | 3 categorias |
| F  | Numbered list | Processos, steps |
| G  | Tabela styled | Dados tabulares |
| H  | Quote box standalone | Citacao de impacto |
| I  | Two-column compare | Pode/Nao pode, Antes/Depois |
| J  | Timeline/Roadmap | Fases, cronograma |
| K  | Template serie | Slides repetitivos (cargos, produtos) |
| L  | KPI dashboard | Numeros grandes + labels |

## Ratio Composicional
- Minimo 70% dos slides devem usar componentes composicionais
- Validar com `validate_variety(prs)`

## Quote Boxes
- 1 quote a cada 5-7 slides, SEMPRE com atribuicao
- NUNCA no topo do slide, NUNCA 2 consecutivas

## Section Dividers
- SEMPRE usar `add_section_divider_rich()` com conteudo no painel direito
- 3 modos: topics, numbers, context
- NUNCA painel direito vazio

## Contraste e "O QUE NAO FAZ"
Incluir secao negativa em slides de role/feature/conceito.

## Acentuacao PT-BR
Todo texto DEVE usar acentuacao correta. Validar com `check_accents(prs)`.

## Checklist Pre-Entrega
- [ ] Design system consistente em TODOS os slides
- [ ] Footer padrao (exceto capa)
- [ ] Variety calendar respeitado
- [ ] Ratio composicional >= 70%
- [ ] Section dividers com conteudo
- [ ] Quote boxes com atribuicao
- [ ] Zero ghost text, zero sobreposicao
- [ ] Fontes explicitas em todos os runs
- [ ] Acentuacao PT-BR correta
- [ ] Validacao tecnica + McKinsey com 0 erros
