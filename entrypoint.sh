#!/bin/sh
set -e

echo "Generating Prisma client..."
npx prisma generate --config src/db/prisma/prisma.config.ts

echo "Running migrations..."
npx prisma migrate deploy --config src/db/prisma/prisma.config.ts

echo "Seeding database..."
npx tsx src/helpers/seed_data.ts

echo "Starting server..."
exec npx tsx main.ts
