import { z } from 'zod';
import { insertAccountSchema, insertCharacterSchema, accounts, characters } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  accounts: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts',
      responses: {
        200: z.array(z.custom<typeof accounts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/accounts',
      input: insertAccountSchema,
      responses: {
        201: z.custom<typeof accounts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/accounts/:id',
      input: insertAccountSchema,
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/accounts/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  characters: {
    list: {
      method: 'GET' as const,
      path: '/api/characters',
      input: z.object({ accountId: z.coerce.number().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof characters.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/characters',
      input: insertCharacterSchema,
      responses: {
        201: z.custom<typeof characters.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/characters/:id',
      input: insertCharacterSchema.partial(),
      responses: {
        200: z.custom<typeof characters.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/characters/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
