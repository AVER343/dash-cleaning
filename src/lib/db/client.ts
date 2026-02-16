import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";

const globalForDb = globalThis as unknown as {
  sqlClient?: ReturnType<typeof postgres>;
  dbClient?: ReturnType<typeof drizzle<typeof schema>>;
};

function initDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!globalForDb.sqlClient) {
    globalForDb.sqlClient = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 15
    });
  }

  if (!globalForDb.dbClient) {
    globalForDb.dbClient = drizzle(globalForDb.sqlClient, { schema });
  }

  return globalForDb.dbClient;
}

export function getDb() {
  const db = initDb();
  if (!db) {
    throw new Error("DATABASE_URL is not set");
  }
  return db;
}
