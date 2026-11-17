### Step 1: Create a Managed Cloud PostgreSQL Database
SQLite (`file:./dev.db`) only lives on a local disk. For cloud production with Vercel, use a managed PostgreSQL provider:
- **Neon** (available directly in the **Vercel Marketplace → Storage → Neon Postgres**), **Supabase**, or **Render PostgreSQL**.
- Once created, copy your PostgreSQL connection string (`DATABASE_URL`), which looks like:
  ```text
  postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
  ```
  *(If using Neon or Supabase with connection pooling, also copy the direct connection URL as `DIRECT_URL` if you use pooled connections).*

---

### Step 2: Switch Prisma from SQLite to PostgreSQL
In [backend/prisma/schema.prisma](file:///c:/Users/TEMP/Documents/GitHub/mana/backend/prisma/schema.prisma#L5-L8), change the `datasource db` block from `"sqlite"` to `"postgresql"`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
*(All models in [schema.prisma](file:///c:/Users/TEMP/Documents/GitHub/mana/backend/prisma/schema.prisma) — including `Json` on `AuditLog` — are already compatible with PostgreSQL).*

---

### Step 3: Push the Schema and Seed the Cloud Database
In [backend/.env](file:///c:/Users/TEMP/Documents/GitHub/mana/backend/.env), set `DATABASE_URL` to your cloud PostgreSQL connection string and run:

```bash
cd backend
npx prisma generate
npx prisma db push
npm run prisma:seed
```
- `npx prisma db push` creates all 18 tables in your cloud Postgres database.
- `npm run prisma:seed` runs [backend/prisma/seed.ts](file:///c:/Users/TEMP/Documents/GitHub/mana/backend/prisma/seed.ts) to populate the initial data.
- In addition, [PrismaService](file:///c:/Users/TEMP/Documents/GitHub/mana/backend/src/prisma/prisma.service.ts#L10-L16) automatically checks if `product.count() === 0` on startup and runs `seedDatabase()` if the database is empty.

---

### Step 4: Deploy the NestJS Backend API
Because the frontend calls the NestJS REST API (`${NEXT_PUBLIC_API_URL}`), host the `backend/` folder on a Node.js service such as **Render**, **Railway**, or **Fly.io** (or as a Vercel/serverless function):
1. **Root Directory**: `backend`
2. **Build Command**:
   ```bash
   npm install && npx prisma generate && npx prisma db push && npm run build
   ```
3. **Start Command**:
   ```bash
   npm run start
   ```
4. **Backend Environment Variables** (configured in [configuration.ts](file:///c:/Users/TEMP/Documents/GitHub/mana/backend/src/config/configuration.ts) and [auth.module.ts](file:///c:/Users/TEMP/Documents/GitHub/mana/backend/src/modules/auth/auth.module.ts)):
   - `NODE_ENV` = `production`
   - `PORT` = `3001` (or provided automatically by the host)
   - `DATABASE_URL` = `postgresql://...` (your cloud Postgres URL)
   - `JWT_SECRET` = a strong random secret (e.g. `openssl rand -hex 32`)
   - `CORS_ORIGINS` = `https://your-project.vercel.app,https://your-custom-domain.com` *(comma-separated, no trailing slash — read by [main.ts](file:///c:/Users/TEMP/Documents/GitHub/mana/backend/src/main.ts#L13-L34))*

---

### Step 5: Connect the Vercel Frontend to the Cloud Backend
In your **Vercel Project Dashboard** (`Settings → Environment Variables`):
1. Set **Root Directory** (under `Settings → General`) to `frontend`.
2. Add the environment variable (read by [frontend/lib/api.ts](file:///c:/Users/TEMP/Documents/GitHub/mana/frontend/lib/api.ts#L4-L9)):
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-service.onrender.com/v1` *(remember the `/v1` suffix)*
   - *(Optional)* `NEXT_PUBLIC_USE_MOCK_DATA` = `false` (already defaults to `false` unless set to `'true'`).
3. **Redeploy** the Vercel project so Next.js inlines `NEXT_PUBLIC_API_URL` into the client bundle.

If the cloud backend is ever unreachable or waking up from cold start, [frontend/lib/api.ts](file:///c:/Users/TEMP/Documents/GitHub/mana/frontend/lib/api.ts#L502-L509) will automatically fall back to [mock-data.ts](file:///c:/Users/TEMP/Documents/GitHub/mana/frontend/lib/mock-data.ts).
