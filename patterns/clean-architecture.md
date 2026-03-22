# Clean Architecture

## 4 Camadas

```
┌─────────────────────────────────────┐
│         Presentation                │  Controllers, Routes, Views, DTOs de entrada
│  ┌─────────────────────────────┐    │
│  │       Application           │    │  Use Cases, DTOs, Interfaces de porta
│  │  ┌─────────────────────┐    │    │
│  │  │      Domain          │    │    │  Entities, Value Objects, Domain Events
│  │  └─────────────────────┘    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Dependency Rule
Dependencias apontam SEMPRE para dentro. Camadas externas conhecem internas, NUNCA o contrario.

## Camada Domain (centro)
```typescript
// entities/order.ts — ZERO imports de framework
export class Order {
  private items: OrderItem[] = [];

  constructor(
    public readonly id: string,
    public readonly customerId: string,
    private status: OrderStatus = 'draft'
  ) {}

  addItem(product: Product, quantity: number): void {
    if (this.status !== 'draft') throw new DomainError('Cannot modify confirmed order');
    if (quantity <= 0) throw new DomainError('Quantity must be positive');
    this.items.push(new OrderItem(product, quantity));
  }

  confirm(): void {
    if (this.items.length === 0) throw new DomainError('Cannot confirm empty order');
    this.status = 'confirmed';
  }

  get total(): Money {
    return this.items.reduce((sum, item) => sum.add(item.subtotal), Money.zero('BRL'));
  }
}
```

## Camada Application (use cases)
```typescript
// use-cases/create-order.ts
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository,  // interface, NAO implementacao
    private readonly eventBus: EventBus            // interface
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const order = new Order(generateId(), input.customerId);
    for (const item of input.items) {
      order.addItem(item.product, item.quantity);
    }
    order.confirm();
    await this.orderRepo.save(order);
    await this.eventBus.publish(new OrderCreatedEvent(order));
    return { orderId: order.id, total: order.total.toString() };
  }
}
```

## Camada Infrastructure
```typescript
// repositories/supabase-order-repository.ts
export class SupabaseOrderRepository implements OrderRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(order: Order): Promise<void> {
    await this.supabase.from('orders').upsert(this.toRow(order));
  }

  async findById(id: string): Promise<Order | null> {
    const { data } = await this.supabase.from('orders').select('*').eq('id', id).single();
    return data ? this.toDomain(data) : null;
  }

  private toRow(order: Order): OrderRow { /* map domain to DB */ }
  private toDomain(row: OrderRow): Order { /* map DB to domain */ }
}
```

## Camada Presentation
```typescript
// app/api/orders/route.ts (Next.js)
export async function POST(req: Request) {
  const body = CreateOrderSchema.parse(await req.json());  // Zod validation
  const useCase = container.resolve(CreateOrderUseCase);    // DI
  const result = await useCase.execute(body);
  return NextResponse.json(result, { status: 201 });
}
// Controller NAO tem logica de negocio — apenas parseia input e chama use case
```

## Decision Matrix

| Cenario | Arquitetura | Justificativa |
|---------|-------------|---------------|
| CRUD simples, 1 dev | MVC / Route handlers | Overhead de camadas nao compensa |
| Dominio complexo, 2+ devs | Clean Architecture | Isolamento facilita testes e evolucao |
| Microsservicos | Clean Architecture por servico | Cada servico tem seu dominio |
| MVP / prototipo | MVC | Velocidade > pureza |

## Armadilhas com IA
- **IA importa ORM no use case** — pedir para usar Repository interface
- **IA coloca logica no controller** — pedir para mover para use case
- **IA cria entidades anemicas** (so getters/setters) — pedir para mover regras de negocio para a entidade
- **IA nao usa Value Objects** — pedir para substituir primitivos (string email -> Email VO)
- **IA cria "god class"** com muitas responsabilidades — pedir para decompor

## Anti-Patterns
- **God Class**: classe com >5 responsabilidades. Decomponha.
- **Leaky Abstraction**: repository que expoe QueryBuilder do ORM. Encapsule.
- **Anemic Domain Model**: entidades sem logica, toda logica em services. Mova para entidade.
- **Smart UI**: logica de negocio em componentes React. Extraia para use case.
- **Framework Coupling**: domain depende de Next.js/Express. Isole.
