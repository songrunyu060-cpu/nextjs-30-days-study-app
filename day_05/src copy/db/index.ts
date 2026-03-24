import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/schema";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

// Neon Serverless (WebSocket) 连接池
const pool = new Pool({ connectionString: getDatabaseUrl() });

export const db = drizzle(pool, { schema });
