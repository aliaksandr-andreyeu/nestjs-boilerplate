import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { getDatabaseUrl } from './prisma/database-url';

export default defineConfig({
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  migrations: {
    path: path.join(__dirname, 'prisma/migrations')
  },
  datasource: {
    url: getDatabaseUrl()
  }
});
