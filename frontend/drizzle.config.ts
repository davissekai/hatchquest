import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: process.env.DOTENV_CONFIG_PATH ?? ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
