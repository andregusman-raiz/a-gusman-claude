# Domain-Driven Design (DDD)

## Bounded Contexts
Cada contexto tem seu proprio modelo de dominio, linguagem ubiqua e limites claros.

```
┌──────────────┐    eventos    ┌──────────────┐
│   Vendas     │──────────────>│   Estoque    │
│  (Order,     │               │  (Product,   │
│   Customer)  │<──────────────│   Stock)     │
└──────────────┘    eventos    └──────────────┘
```

### Comunicacao entre Contexts
- **Eventos de Integracao**: assincrono, desacoplado (RECOMENDADO)
- **API sincrona**: quando precisa de resposta imediata (use com moderacao)
- **Shared Kernel**: codigo compartilhado (evitar — cria acoplamento)

### Context Map
| Relacao | Descricao | Quando |
|---------|-----------|--------|
| Customer-Supplier | Um context fornece, outro consome | Times diferentes |
| Conformist | Consumer adota modelo do supplier | Sem poder de negociacao |
| Anti-Corruption Layer | Traduz modelo externo para interno | Integrar sistema legado |
| Partnership | Ambos evoluem juntos | Mesmo time ou time proximo |

## Aggregates

### Regras
1. Acesso externo SOMENTE pelo Aggregate Root
2. Invariantes protegidos DENTRO do aggregate
3. Uma transacao = um aggregate (nao salvar 2 aggregates na mesma transacao)
4. Preferir aggregates pequenos (1-3 entidades)
5. Referencia entre aggregates por ID, nao por objeto

```typescript
// Order e o Aggregate Root
export class Order {
  private readonly items: OrderItem[] = [];  // entidade interna
  private status: OrderStatus;

  // Invariante: pedido so pode ser confirmado se tiver items
  confirm(): void {
    if (this.items.length === 0) {
      throw new DomainError('Cannot confirm empty order');
    }
    this.status = 'confirmed';
    this.addEvent(new OrderConfirmedEvent(this.id, this.total));
  }

  // Invariante: nao pode modificar pedido confirmado
  addItem(productId: string, price: Money, quantity: number): void {
    if (this.status !== 'draft') {
      throw new DomainError('Cannot modify confirmed order');
    }
    const existing = this.items.find(i => i.productId === productId);
    if (existing) {
      existing.increaseQuantity(quantity);
    } else {
      this.items.push(new OrderItem(productId, price, quantity));
    }
  }
}
```

## Value Objects

### Caracteristicas
- Imutaveis (nao tem setter)
- Igualdade por valor (nao por referencia)
- Auto-validantes (factory method rejeita valores invalidos)
- Sem identidade propria

```typescript
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (amount < 0) throw new DomainError('Amount cannot be negative');
  }

  static of(amount: number, currency: string): Money {
    return new Money(amount, currency);
  }

  static zero(currency: string): Money {
    return new Money(0, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new DomainError('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}

export class Email {
  private constructor(public readonly value: string) {}

  static create(value: string): Email {
    if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new DomainError(`Invalid email: ${value}`);
    }
    return new Email(value.toLowerCase().trim());
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

## Domain Events
```typescript
export abstract class DomainEvent {
  public readonly occurredAt = new Date();
  abstract readonly type: string;
}

export class OrderConfirmedEvent extends DomainEvent {
  readonly type = 'order.confirmed';
  constructor(
    public readonly orderId: string,
    public readonly total: Money
  ) { super(); }
}
```

## Armadilhas com IA
- **Entidades anemicas**: IA gera classes com getters/setters sem logica de negocio. Pedir para mover regras para a entidade.
- **Primitivos em vez de Value Objects**: IA usa `string` para email, `number` para dinheiro. Pedir Value Object.
- **Mutacao direta**: IA permite `order.status = 'confirmed'` em vez de `order.confirm()`. Encapsular.
- **Aggregate grande demais**: IA coloca tudo em 1 aggregate. Dividir por invariantes.
- **Transicoes de estado desprotegidas**: IA permite qualquer transicao. Implementar state machine.
- **Referencia por objeto**: IA faz `order.customer` em vez de `order.customerId`. Usar IDs.

## Anti-Patterns
- **Transaction Script disfarçado**: toda logica em services, entidades vazias
- **Smart UI**: logica de dominio em componentes visuais
- **Big Ball of Mud**: sem limites entre contexts
- **Shared Database**: dois contexts acessando mesma tabela — acopla
