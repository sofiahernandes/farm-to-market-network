import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(backendRoot, 'prisma', 'schema.prisma');
const envPath = path.join(backendRoot, '.env');

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.trim();
  }
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return 'file:./dev.db';
}

function resolveProvider(dbUrl) {
  const forced = process.env.PRISMA_PROVIDER?.trim().toLowerCase();
  if (forced === 'postgresql' || forced === 'postgres') return 'postgresql';
  if (forced === 'sqlite') return 'sqlite';
  if (
    dbUrl.startsWith('postgres://') ||
    dbUrl.startsWith('postgresql://') ||
    dbUrl.startsWith('prisma+postgres://')
  ) {
    return 'postgresql';
  }
  return 'sqlite';
}

const dbUrl = readDatabaseUrl();
const targetProvider = resolveProvider(dbUrl);
const hasDirectUrl = Boolean(process.env.DIRECT_URL?.trim());

const schema = fs.readFileSync(schemaPath, 'utf8');
const datasourceBlock =
  targetProvider === 'postgresql' && hasDirectUrl
    ? `datasource db {\n  provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")\n}`
    : `datasource db {\n  provider = "${targetProvider}"\n  url      = env("DATABASE_URL")\n}`;

const updated = schema.replace(
  /datasource\s+db\s*\{[\s\S]*?\}/,
  datasourceBlock
);

if (updated !== schema) {
  fs.writeFileSync(schemaPath, updated, 'utf8');
  console.log(
    `[prisma:provider] Updated prisma/schema.prisma datasource provider to "${targetProvider}".`
  );
} else {
  console.log(
    `[prisma:provider] prisma/schema.prisma datasource provider is "${targetProvider}".`
  );
}
