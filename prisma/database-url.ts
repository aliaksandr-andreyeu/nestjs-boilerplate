import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env') });

/** URL for migrate; a stub is enough for generate if .env is not set yet */
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/nestjs_boilerplate';
}
