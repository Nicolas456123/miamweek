export const runtime = "nodejs";

export async function GET() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  // Test 1: env vars
  if (!url || !token) {
    return Response.json({ error: "Missing env vars", url: !!url, token: !!token });
  }

  // Test 2: direct HTTP call to Turso
  try {
    const httpUrl = url.replace("libsql://", "https://");
    const res = await fetch(`${httpUrl}/v2/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql: "SELECT COUNT(*) as count FROM products" } },
          { type: "close" },
        ],
      }),
    });
    const data = await res.json();
    return Response.json({
      status: "ok",
      envUrl: url.substring(0, 40),
      httpStatus: res.status,
      data,
    });
  } catch (error) {
    return Response.json({
      error: "HTTP fetch failed",
      details: String(error),
      envUrl: url.substring(0, 40),
    });
  }
}
