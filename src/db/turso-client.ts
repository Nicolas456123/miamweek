// Minimal Turso HTTP client that works on Vercel without @libsql/client
// Uses the Turso HTTP API directly with fetch

type Value = string | number | null;
type Row = Record<string, Value>;

interface TursoResult {
  columns: string[];
  rows: Row[];
  rowsAffected: number;
  lastInsertRowid: number | null;
}

function parseValue(cell: { type: string; value?: string }): Value {
  if (cell.type === "null" || cell.value === undefined) return null;
  if (cell.type === "integer") return parseInt(cell.value, 10);
  if (cell.type === "float") return parseFloat(cell.value);
  return cell.value;
}

export class TursoHttpClient {
  private url: string;
  private authToken: string;

  constructor(url: string, authToken: string) {
    this.url = url.replace("libsql://", "https://");
    this.authToken = authToken;
  }

  async execute(sql: string, args?: Value[]): Promise<TursoResult> {
    const stmt: { sql: string; args?: { type: string; value: string }[] } = { sql };
    if (args && args.length > 0) {
      stmt.args = args.map((a) => {
        if (a === null) return { type: "null", value: "" };
        if (typeof a === "number")
          return Number.isInteger(a)
            ? { type: "integer", value: String(a) }
            : { type: "float", value: String(a) };
        return { type: "text", value: String(a) };
      });
    }

    const res = await fetch(`${this.url}/v2/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [{ type: "execute", stmt }, { type: "close" }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Turso HTTP error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const result = data.results?.[0];

    if (result?.type === "error") {
      throw new Error(`Turso SQL error: ${result.error?.message}`);
    }

    const execResult = result?.response?.result;
    if (!execResult) return { columns: [], rows: [], rowsAffected: 0, lastInsertRowid: null };

    const columns = execResult.cols.map((c: { name: string }) => c.name);
    const rows = execResult.rows.map(
      (row: { type: string; value?: string }[]) => {
        const obj: Row = {};
        row.forEach((cell, i) => {
          obj[columns[i]] = parseValue(cell);
        });
        return obj;
      }
    );

    return {
      columns,
      rows,
      rowsAffected: execResult.affected_row_count || 0,
      lastInsertRowid: execResult.last_insert_rowid
        ? parseInt(execResult.last_insert_rowid, 10)
        : null,
    };
  }
}

let _client: TursoHttpClient | null = null;

export function getTursoClient(): TursoHttpClient {
  if (!_client) {
    _client = new TursoHttpClient(
      process.env.TURSO_DATABASE_URL!,
      process.env.TURSO_AUTH_TOKEN!
    );
  }
  return _client;
}
