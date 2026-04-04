import { NextRequest } from "next/server";
import { db } from "@/db";
import { houseTasks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);
    const body = await request.json();
    const { name, frequency, icon, assignedTo, markDone } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (icon !== undefined) updateData.icon = icon;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (markDone) updateData.lastDone = new Date().toISOString();

    const [updated] = await db
      .update(houseTasks)
      .set(updateData)
      .where(eq(houseTasks.id, taskId))
      .returning();

    if (!updated) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json(updated);
  } catch (error) {
    return Response.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskId = parseInt(id, 10);

    const [deleted] = await db
      .delete(houseTasks)
      .where(eq(houseTasks.id, taskId))
      .returning();

    if (!deleted) {
      return Response.json({ error: "Task not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
