// =============================================================================
// Service: {{SERVICE_NAME}}
// Arquivo: src/lib/services/{{service_name}}.service.ts
// =============================================================================

import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database.types';

// -----------------------------------------------------------------------------
// 1. Schema & Types
// -----------------------------------------------------------------------------

// TODO: Definir schema Zod com campos do dominio
export const {{Entity}}Schema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export type {{Entity}}Input = z.infer<typeof {{Entity}}Schema>;

// Result type para retornos explicitos
type Result<T> = { success: true; data: T } | { success: false; error: string };

// -----------------------------------------------------------------------------
// 2. Service
// -----------------------------------------------------------------------------

export class {{ServiceName}}Service {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // TODO: Ajustar nome da tabela
  private readonly TABLE = '{{table_name}}' as const;

  async create(input: {{Entity}}Input, userId: string): Promise<Result<{ id: string }>> {
    const parsed = {{Entity}}Schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const { data, error } = await this.supabase
      .from(this.TABLE)
      .insert({ ...parsed.data, user_id: userId })
      .select('id')
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: { id: data.id } };
  }

  async getById(id: string): Promise<Result<Database['public']['Tables']['{{table_name}}']['Row']>> {
    const { data, error } = await this.supabase
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  }

  async list(
    userId: string,
    opts: { page?: number; pageSize?: number; status?: string } = {}
  ): Promise<Result<{ items: unknown[]; total: number }>> {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from(this.TABLE)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (opts.status) {
      query = query.eq('status', opts.status);
    }

    const { data, error, count } = await query;
    if (error) return { success: false, error: error.message };
    return { success: true, data: { items: data ?? [], total: count ?? 0 } };
  }

  async update(id: string, input: Partial<{{Entity}}Input>): Promise<Result<void>> {
    const { error } = await this.supabase
      .from(this.TABLE)
      .update(input)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true, data: undefined };
  }

  async delete(id: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true, data: undefined };
  }
}
