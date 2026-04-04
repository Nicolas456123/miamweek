import { NextRequest } from "next/server";
import { db } from "@/db";
import { houseTasks } from "@/db/schema";

export async function GET() {
  try {
    const tasks = await db.select().from(houseTasks);
    return Response.json(tasks);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, frequency, icon, assignedTo } = body;

    if (!name || !frequency) {
      return Response.json(
        { error: "name and frequency are required" },
        { status: 400 }
      );
    }

    const [task] = await db
      .insert(houseTasks)
      .values({ name, frequency, icon, assignedTo })
      .returning();

    return Response.json(task, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
