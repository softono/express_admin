import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import config from "@/config";
import * as schema from "@/models/schema";

const globalForDb = global as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__pgClient ??
  postgres(config.DATABASE_URL as string, {
    max: 10,
    idle_timeout: 45,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
export default db;
