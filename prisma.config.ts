import "dotenv/config";
import { defineConfig } from "prisma/config";

// Enables schema validation/client generation in environments that intentionally have no database.
// Every networked migration command is still blocked by scripts/prisma-safe.ts unless real env and
// the server-side marker are present.
const schemaOnlyUrl = "postgresql://schema:only@127.0.0.1:5432/schema_only";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? schemaOnlyUrl,
  },
});
