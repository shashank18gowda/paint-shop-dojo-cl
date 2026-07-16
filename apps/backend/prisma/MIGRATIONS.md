# Running Migrations

```bash
# First time setup (with Docker postgres running):
pnpm exec prisma migrate dev --name init --schema=prisma/schema.prisma

# Seed the database:
pnpm exec prisma db seed

# Open Prisma Studio:
pnpm exec prisma studio --schema=prisma/schema.prisma
```

# Important: Prisma 7 + pnpm workspace notes
- Generated client lives at `src/generated/prisma/` (custom output)
- tsconfig.json has path alias: `@prisma/client` → `./src/generated/prisma`
- `prisma.config.ts` at backend root handles CLI datasource config (Prisma 7 requirement)
- All `prisma generate` calls must specify `--schema=prisma/schema.prisma`
