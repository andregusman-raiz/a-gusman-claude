// =============================================================================
// Tests: {{ServiceName}}Service
// Arquivo: src/lib/services/__tests__/{{service_name}}.service.test.ts
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { {{ServiceName}}Service, {{Entity}}Schema } from '../{{service_name}}.service';

// -----------------------------------------------------------------------------
// Mock Supabase Client
// -----------------------------------------------------------------------------

function createMockSupabase() {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };
  return {
    from: vi.fn(() => chainable),
    _chain: chainable,
  };
}

// TODO: Ajustar userId e dados de teste para o dominio
const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('{{ServiceName}}Service', () => {
  let service: {{ServiceName}}Service;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new {{ServiceName}}Service(mockSupabase as any);
  });

  // --- Schema Validation ---------------------------------------------------

  describe('{{Entity}}Schema', () => {
    it('accepts valid input', () => {
      const result = {{Entity}}Schema.safeParse({ name: 'Test Item' });
      expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
      const result = {{Entity}}Schema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const result = {{Entity}}Schema.safeParse({ name: 'Test', status: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  // --- Create ---------------------------------------------------------------

  describe('create', () => {
    it('returns created id on success', async () => {
      const expectedId = 'new-uuid-123';
      mockSupabase._chain.single.mockResolvedValue({
        data: { id: expectedId },
        error: null,
      });

      const result = await service.create({ name: 'New Item' }, TEST_USER_ID);

      expect(result).toEqual({ success: true, data: { id: expectedId } });
    });

    it('returns error on invalid input', async () => {
      const result = await service.create({ name: '' } as any, TEST_USER_ID);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });

    it('returns error on database failure', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: null,
        error: { message: 'duplicate key', code: '23505' },
      });

      const result = await service.create({ name: 'Dup' }, TEST_USER_ID);

      expect(result).toEqual({ success: false, error: 'duplicate key' });
    });
  });

  // --- GetById --------------------------------------------------------------

  describe('getById', () => {
    it('returns entity on success', async () => {
      const mockRow = { id: 'abc', name: 'Found', status: 'active' };
      mockSupabase._chain.single.mockResolvedValue({ data: mockRow, error: null });

      const result = await service.getById('abc');

      expect(result).toEqual({ success: true, data: mockRow });
    });

    it('returns error when not found', async () => {
      mockSupabase._chain.single.mockResolvedValue({
        data: null,
        error: { message: 'not found', code: 'PGRST116' },
      });

      const result = await service.getById('nonexistent');

      expect(result.success).toBe(false);
    });
  });

  // --- Delete ---------------------------------------------------------------

  describe('delete', () => {
    it('returns success on delete', async () => {
      mockSupabase._chain.eq.mockResolvedValue({ error: null });

      const result = await service.delete('abc');

      expect(result).toEqual({ success: true, data: undefined });
    });

    it('returns error on delete failure', async () => {
      mockSupabase._chain.eq.mockResolvedValue({
        error: { message: 'foreign key violation' },
      });

      const result = await service.delete('abc');

      expect(result.success).toBe(false);
    });
  });
});
