import { drizzle } from "drizzle-orm/libsql/web";
import * as schema from "./schema";

function createDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  }

  // Use drizzle's built-in connection string support
  return drizzle({ connection: { url, authToken }, schema });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const instance = createDb();
    return (instance as any)[prop];
  },
}) as ReturnType<typeof createDb>;
