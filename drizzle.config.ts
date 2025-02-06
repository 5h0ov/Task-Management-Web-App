import { defineConfig } from 'drizzle-kit';
import { config } from "dotenv";
import fs from "fs";

const envFiles = [".env", ".env.local", ".env.development", ".env.production"];

// Find the first existing .env file
const envFile = envFiles.find(file => fs.existsSync(file));

if (envFile) {
  console.log(`Loading environment variables from ${envFile}`);
  config({ path: envFile });
} else {
  console.warn("No .env file found.");
}


export default defineConfig({
  out: './drizzle',   // migrations will be saved in this directory
  schema: './lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
