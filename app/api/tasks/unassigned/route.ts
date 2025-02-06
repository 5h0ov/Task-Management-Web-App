import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, isNull, and, sql, or } from "drizzle-orm";
import { verifyToken } from "@/lib/utils/auth";

export async function GET(request: Request) {
  try {
    // Auth check
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    
    const userCondition = eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`));

    // If editing (projectId provided), get both unassigned tasks AND tasks assigned to this project (for the dialog selection process)
    const projectCondition = projectId 
    ? or(
        isNull(tasks.projectId),
        eq(tasks.projectId, sql.raw(`'${projectId}'::uuid`))
      )
    : isNull(tasks.projectId);
    
    const availableTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
      })
      .from(tasks)
      .where(and(userCondition, projectCondition));


    console.log("Available tasks:", availableTasks);

    return NextResponse.json(availableTasks, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching unassigned tasks:', error);
    return NextResponse.json(
      { message: "Failed to fetch unassigned tasks" }, 
      { status: 500 }
    );
  }
}