import { config } from 'dotenv';
import path from 'node:path';

config({ path: path.resolve(process.cwd(), '.env') });

/** URL для migrate; для generate достаточно заглушки, если .env ещё нет */
export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/nestjs_boilerplate';
}
