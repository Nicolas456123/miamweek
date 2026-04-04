import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/web";
import * as schema from "./schema";

function createDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      `Missing database credentials: url=${url ? "set" : "missing"}, token=${authToken ? "set" : "missing"}`
    );
  }

  // Convert libsql:// to https:// for web client
  const httpUrl = url.replace("libsql://", "https://");

  const client = createClient({ url: httpUrl, authToken });
  return drizzle(client, { schema });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const instance = createDb();
    return (instance as any)[prop];
  },
}) as ReturnType<typeof drizzle<typeof schema>>;
