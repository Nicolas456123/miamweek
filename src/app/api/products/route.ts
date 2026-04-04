import { db } from "@/db";
import { products } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(asc(products.category), asc(products.name));

  return Response.json(allProducts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, category, defaultUnit, icon } = body;

  if (!name || !category || !defaultUnit) {
    return Response.json(
      { error: "name, category, and defaultUnit are required" },
      { status: 400 }
    );
  }

  const result = await db.insert(products).values({
    name,
    category,
    defaultUnit,
    icon: icon || null,
    isCustom: true,
  }).returning();

  return Response.json(result[0], { status: 201 });
}
