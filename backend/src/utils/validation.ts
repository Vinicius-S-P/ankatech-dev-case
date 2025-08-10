import { z } from 'zod';

const categoryEnum = z.enum(['plano_original', 'situacao_atual', 'custo_vida']);

export const createDataSchema = z.object({
  label: z.string().min(1, 'Label is required').max(255),
  value: z.number().positive('Value must be positive'),
  category: categoryEnum,
  date: z.string().datetime().optional().or(z.date().optional())
});

export const updateDataSchema = z.object({
  label: z.string().min(1).max(255).optional(),
  value: z.number().positive().optional(),
  category: categoryEnum.optional(),
  date: z.string().datetime().optional().or(z.date().optional())
});

export const filterSchema = z.object({
  category: categoryEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  sort: z.enum(['date', 'value', 'label', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional()
});

export const idSchema = z.object({
  id: z.string().min(1, 'ID is required')
});

export type CreateDataInput = z.infer<typeof createDataSchema>;
export type UpdateDataInput = z.infer<typeof updateDataSchema>;
export type FilterInput = z.infer<typeof filterSchema>;
export type IdInput = z.infer<typeof idSchema>;

