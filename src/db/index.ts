import { getTursoClient, TursoHttpClient } from "./turso-client";

// Re-export the raw client for direct SQL queries
export { getTursoClient };
export type { TursoHttpClient };

// Helper to run queries easily
export async function query(sql: string, args?: (string | number | null)[]) {
  const client = getTursoClient();
  return client.execute(sql, args);
}

// Keep a dummy db export for backward compatibility during migration
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = null as any;
