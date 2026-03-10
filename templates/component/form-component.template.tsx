// =============================================================================
// Form Component: {{FormName}}
// Arquivo: src/components/{{FormName}}.tsx
// =============================================================================

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';

// -----------------------------------------------------------------------------
// Schema
// -----------------------------------------------------------------------------

// TODO: Definir schema Zod com campos do formulario
const {{formName}}Schema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(255),
  email: z.string().email('Email invalido'),
  description: z.string().max(1000).optional(),
});

type {{FormName}}Data = z.infer<typeof {{formName}}Schema>;

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface {{FormName}}Props {
  /** Valores iniciais para edicao (undefined = criacao) */
  defaultValues?: Partial<{{FormName}}Data>;
  /** Server action ou callback de submit */
  onSubmit: (data: {{FormName}}Data) => Promise<{ error?: string }>;
  /** Callback apos submit com sucesso */
  onSuccess?: () => void;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function {{FormName}}({ defaultValues, onSubmit, onSuccess }: {{FormName}}Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{{FormName}}Data>({
    resolver: zodResolver({{formName}}Schema),
    defaultValues: {
      name: '',
      email: '',
      description: '',
      ...defaultValues,
    },
  });

  const handleFormSubmit = handleSubmit((data) => {
    startTransition(async () => {
      setServerError(null);
      const result = await onSubmit(data);
      if (result.error) {
        setServerError(result.error);
      } else {
        reset();
        onSuccess?.();
      }
    });
  });

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Server Error */}
      {serverError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {/* TODO: Ajustar campos conforme schema */}

      {/* Name */}
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm font-medium">Nome</label>
        <input
          id="name"
          {...register('name')}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isPending}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isPending}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label htmlFor="description" className="text-sm font-medium">Descricao</label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isPending}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? 'Salvando...' : defaultValues ? 'Atualizar' : 'Criar'}
      </button>
    </form>
  );
}
