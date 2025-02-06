import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
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

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);


// import { drizzle } from 'drizzle-orm/node-postgres';
// import { Pool } from 'pg';
// import * as schema from './schema';

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
// });

// export const db = drizzle(pool, { schema });