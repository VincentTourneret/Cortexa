import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || env("DATABASE_URL") || "postgresql://cortexa:cortexa_password@localhost:5433/cortexa_db?schema=public",
  },
});
