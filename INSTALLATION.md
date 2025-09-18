# Installation (Prisma + Cloudflare D1)

## 0. Install dependencies
```sh
npm install
```

## 1. Configure Wrangler
Copy the example config:
```sh
cp wrangler.toml.example wrangler.toml
```
Update `wrangler.toml`:
- Replace `$APP_NAME` with your Cloudflare Workers app name  
- Replace `$CURRENT_DATE` with today’s date (e.g. `2025-09-18`)  

Add your D1 binding:
```toml
[[d1_databases]]
binding = "DB"
database_name = "edu-pulse"
database_id = "<copied-from-wrangler-create-output>"
```

## 2. Create a D1 database
```sh
npx wrangler d1 create edu-pulse
```
Copy the database ID output into `wrangler.toml`.

## 3. Set up local development with Prisma (SQLite)
```sh
printf 'DATABASE_URL="file:./prisma/dev.db"\n' > .env
npx prisma migrate dev --name init
```
This will:
- Create `prisma/dev.db`
- Apply migrations
- Generate Prisma Client + Zod types

## 4. Apply Prisma migrations to D1
If you already have a Prisma migration (e.g. `prisma/migrations/20250906151153_init/migration.sql`), apply it directly:

```sh
# Install Wrangler and log in (first time only)
npm i -D wrangler@latest
npx wrangler login

# Apply to local D1 (for testing)
npx wrangler d1 execute edu-pulse --local --file=prisma/migrations/20250906151153_init/migration.sql

# Apply to remote D1 (production/staging)
npx wrangler d1 execute edu-pulse --remote --file=prisma/migrations/20250906151153_init/migration.sql
```

## 5. Deploy the application
```sh
npm run deploy
```
