// =============================================================================
// Repository: {{ENTITY_NAME}}
// Arquivo: src/lib/repositories/{{entity_name}}.repository.ts
// =============================================================================

import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database.types';

// TODO: Ajustar para a tabela correta
type Row = Database['public']['Tables']['{{table_name}}']['Row'];
type Insert = Database['public']['Tables']['{{table_name}}']['Insert'];
type Update = Database['public']['Tables']['{{table_name}}']['Update'];

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface QueryOptions {
  page?: number;
  pageSize?: number;
  orderBy?: keyof Row;
  ascending?: boolean;
}

class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly original?: PostgrestError
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

// -----------------------------------------------------------------------------
// Repository
// -----------------------------------------------------------------------------

export class {{EntityName}}Repository {
  // TODO: Ajustar nome da tabela
  private readonly TABLE = '{{table_name}}' as const;

  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Row | null> {
    const { data, error } = await this.supabase
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error?.code === 'PGRST116') return null; // not found
    if (error) throw this.wrapError('findById', error);
    return data;
  }

  async findMany(
    filters: Partial<Record<keyof Row, unknown>> = {},
    options: QueryOptions = {}
  ): Promise<PaginatedResult<Row>> {
    const { page = 1, pageSize = 20, orderBy = 'created_at' as keyof Row, ascending = false } = options;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from(this.TABLE)
      .select('*', { count: 'exact' })
      .order(String(orderBy), { ascending })
      .range(from, to);

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    }

    const { data, error, count } = await query;
    if (error) throw this.wrapError('findMany', error);

    const total = count ?? 0;
    return {
      data: data ?? [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async insert(record: Insert): Promise<Row> {
    const { data, error } = await this.supabase
      .from(this.TABLE)
      .insert(record)
      .select('*')
      .single();

    if (error) throw this.wrapError('insert', error);
    return data;
  }

  async update(id: string, changes: Update): Promise<Row> {
    const { data, error } = await this.supabase
      .from(this.TABLE)
      .update(changes)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw this.wrapError('update', error);
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) throw this.wrapError('remove', error);
  }

  async exists(id: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from(this.TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('id', id);

    if (error) throw this.wrapError('exists', error);
    return (count ?? 0) > 0;
  }

  private wrapError(operation: string, error: PostgrestError): RepositoryError {
    return new RepositoryError(
      `{{EntityName}}Repository.${operation} failed: ${error.message}`,
      error.code,
      error
    );
  }
}
