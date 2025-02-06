import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { sql, eq, and } from "drizzle-orm";
import { cookies } from 'next/headers';
import { verifyToken } from "@/lib/utils/auth";

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }


    
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    console.log('date param:', dateParam);

    if (dateParam) {

      // get tasks for that specific date
      const dateTasks = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          project: {
            id: projects.id,
            name: projects.name
          }
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .where(
          and(
            eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`)),
            sql`DATE(${tasks.dueDate}) = DATE(${sql.raw(`'${dateParam}'`)})`
          )
        );

      return NextResponse.json(dateTasks, { status: 200 });
    } else {

      // get all unique dates with tasks
      const dates = await db
        .select({
          date: sql<string>`DATE(${tasks.dueDate})::text`
        })
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`)),
            sql`${tasks.dueDate} IS NOT NULL`
          )
        )
        .groupBy(sql`DATE(${tasks.dueDate})`);

      return NextResponse.json(dates.map(d => d.date), { status: 200 });
    } 
  } catch (error: unknown) {
    console.error('Tasks by date error:', error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}