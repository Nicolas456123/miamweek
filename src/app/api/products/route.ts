import { db } from "@/db";
import { products } from "@/db/schema";
import { asc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  try {
    const allProducts = await db
      .select()
      .from(products)
      .orderBy(asc(products.category), asc(products.name));

    return Response.json(allProducts);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return Response.json(
      {
        error: "Failed to fetch products",
        details: String(error),
        dbUrl: process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL.substring(0, 30) + "..." : "NOT SET",
        hasToken: !!process.env.TURSO_AUTH_TOKEN,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, defaultUnit, icon } = body;

    if (!name || !category || !defaultUnit) {
      return Response.json(
        { error: "name, category, and defaultUnit are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(products)
      .values({
        name,
        category,
        defaultUnit,
        icon: icon || null,
        isCustom: true,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return Response.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
