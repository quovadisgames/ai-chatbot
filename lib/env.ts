import { z } from 'zod';

const envSchema = z.object({
  POSTGRES_URL: z.string().optional(),
  USE_MOCK_DB: z.string().optional(),
});

export const env = envSchema.parse(process.env); 