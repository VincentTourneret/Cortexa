// Chargement optionnel : en production (Docker/CapRover), dotenv n'est pas installé, les vars sont injectées au runtime
try {
  require("dotenv/config");
} catch {
  /* dotenv non disponible */
}

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || env("DATABASE_URL") || "postgresql://cortexa:cortexa_password@localhost:5433/cortexa_db?schema=public",
  },
});
