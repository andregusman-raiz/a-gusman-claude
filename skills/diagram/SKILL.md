---
name: diagram
description: "Gerar diagramas tecnicos: flowcharts, sequence, ER, architecture, class diagrams. Mermaid (preferido), PlantUML, D2. Trigger quando usuario quer diagrama, fluxo, arquitetura visual, ou ER diagram."
model: sonnet
argument-hint: "[flowchart|sequence|er|architecture|class] [descricao]"
metadata:
  filePattern: "*.mmd,*.puml,*.d2"
  bashPattern: "diagram|mermaid|plantuml|flowchart|sequence|arquitetura.*visual"
  priority: 70
---

# Diagram Skill

Gerar diagramas tecnicos com Mermaid (preferido), PlantUML ou D2.

## Decision Matrix

| Diagram Type | Best Tool | Reason |
|-------------|-----------|--------|
| Flowchart | Mermaid | Simples, renderiza direto |
| Sequence | Mermaid | Excelente suporte |
| ER / Data Model | Mermaid | erDiagram nativo |
| Class | Mermaid | classDiagram nativo |
| Gantt | Mermaid | gantt nativo |
| State Machine | Mermaid | stateDiagram-v2 |
| Architecture (complex) | D2 | Melhor layout para diagramas grandes |
| Deployment | PlantUML | Mais icons de infra |
| C4 Model | PlantUML | Plugin C4 dedicado |

## Rendering

Usar o MCP tool `mcp__mermaid__generate` para renderizar diagramas como PNG/SVG:

```
mcp__mermaid__generate({
  code: "flowchart LR\n  A --> B",
  name: "my-diagram",
  outputFormat: "png",
  theme: "default",
  folder: "/tmp"
})
```

Temas disponiveis: `default`, `forest`, `dark`, `neutral`

## Mermaid Syntax

### Flowchart
```mermaid
flowchart LR
    A[Start] --> B{Decision?}
    B -->|Yes| C[Process A]
    B -->|No| D[Process B]
    C --> E[End]
    D --> E

    style A fill:#4361ee,color:#fff
    style E fill:#2d6a4f,color:#fff
    style B fill:#f4845f,color:#fff
```

Direcoes: `TB` (top-bottom), `BT`, `LR` (left-right), `RL`

Shapes: `[rect]`, `(rounded)`, `{diamond}`, `([stadium])`, `[[subroutine]]`, `[(cylinder)]`, `((circle))`, `>flag]`, `{hexagon}`

### Sequence Diagram
```mermaid
sequenceDiagram
    actor U as User
    participant F as Frontend
    participant A as API
    participant D as Database

    U->>F: Click login
    F->>A: POST /auth/login
    A->>D: SELECT user
    D-->>A: User data
    A-->>F: JWT token
    F-->>U: Redirect to dashboard

    Note over A,D: Auth flow
    rect rgb(200, 220, 255)
        A->>D: Log access
        D-->>A: OK
    end
```

Arrows: `->>` (solid), `-->>` (dashed), `-x` (cross), `-)` (async)

### Class Diagram
```mermaid
classDiagram
    class User {
        +String id
        +String name
        +String email
        +login() bool
        +logout() void
    }
    class Order {
        +String id
        +Date createdAt
        +Float total
        +addItem(item) void
        +checkout() bool
    }
    class Product {
        +String id
        +String name
        +Float price
    }

    User "1" --> "*" Order : places
    Order "*" --> "*" Product : contains
```

### ER Diagram
```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    PRODUCT ||--o{ ORDER_ITEM : "ordered in"
    USER {
        uuid id PK
        string name
        string email UK
        timestamp created_at
    }
    ORDER {
        uuid id PK
        uuid user_id FK
        decimal total
        string status
        timestamp created_at
    }
    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        decimal price
    }
    PRODUCT {
        uuid id PK
        string name
        decimal price
        string category
    }
```

Relationships: `||--||` (one-to-one), `||--o{` (one-to-many), `}o--o{` (many-to-many)

### Gantt
```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Planning
    Research           :a1, 2026-04-01, 5d
    Requirements       :a2, after a1, 3d

    section Development
    Backend API        :b1, after a2, 10d
    Frontend UI        :b2, after a2, 12d
    Integration        :b3, after b1, 5d

    section Release
    Testing            :c1, after b3, 5d
    Deploy             :milestone, after c1, 0d
```

### State Diagram
```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Review : submit
    Review --> Approved : approve
    Review --> Draft : reject
    Approved --> Published : publish
    Published --> Archived : archive
    Archived --> [*]

    state Review {
        [*] --> Pending
        Pending --> InReview : assign
        InReview --> Done : complete
    }
```

### Pie Chart
```mermaid
pie title Budget Allocation
    "Engineering" : 45
    "Marketing" : 20
    "Operations" : 15
    "Support" : 10
    "Other" : 10
```

### User Journey
```mermaid
journey
    title User Onboarding
    section Sign Up
      Visit landing page: 5: User
      Click sign up: 4: User
      Fill form: 3: User
      Verify email: 2: User
    section First Use
      Complete profile: 4: User
      Follow tutorial: 3: User
      Create first item: 5: User
```

## Common Templates

### API Flow
```mermaid
flowchart LR
    Client --> LB[Load Balancer]
    LB --> API1[API Server 1]
    LB --> API2[API Server 2]
    API1 --> Cache[(Redis)]
    API2 --> Cache
    API1 --> DB[(PostgreSQL)]
    API2 --> DB
    API1 --> Queue[Message Queue]
    Queue --> Worker[Worker]
```

### Auth Flow
```mermaid
sequenceDiagram
    User->>App: Login request
    App->>Auth: Validate credentials
    Auth-->>App: JWT + Refresh token
    App-->>User: Set cookies
    User->>App: API request + JWT
    App->>App: Verify JWT
    App-->>User: Response
    Note over User,App: Token expired
    User->>App: Request + expired JWT
    App->>Auth: Refresh token
    Auth-->>App: New JWT
    App-->>User: Response + new JWT
```

### Deploy Pipeline
```mermaid
flowchart LR
    Dev[Developer] --> PR[Pull Request]
    PR --> CI{CI Checks}
    CI -->|Pass| Review[Code Review]
    CI -->|Fail| Dev
    Review -->|Approve| Merge[Merge to main]
    Review -->|Changes| Dev
    Merge --> Build[Build]
    Build --> Preview[Preview Deploy]
    Preview --> Prod[Production Deploy]

    style CI fill:#f4845f
    style Prod fill:#2d6a4f,color:#fff
```

## Best Practices

1. **Direcao**: LR (left-to-right) para fluxos, TB para hierarquias
2. **Max nodes**: 15 por diagrama — dividir se maior
3. **Cores**: Usar sparingly, apenas para enfase (max 3 cores)
4. **Labels**: Curtos e descritivos (max 3 palavras)
5. **Agrupamento**: Usar subgraphs para agrupar componentes relacionados
6. **Consistencia**: Mesmo estilo de shapes para mesma categoria
7. **Notes**: Adicionar notas explicativas em sequence diagrams
8. **Renderizar**: Sempre gerar imagem via MCP para validacao visual

## Regras de Uso

1. Mermaid como primeira escolha (renderiza via MCP)
2. Validar sintaxe antes de renderizar
3. Max 15 nodes por diagrama
4. Sempre especificar direcao (LR, TB, etc.)
5. Usar cores com parcimonia — max 3 destaques
6. Salvar tanto o source (.mmd) quanto a imagem (.png)
