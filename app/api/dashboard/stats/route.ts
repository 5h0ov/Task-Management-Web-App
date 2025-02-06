import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { and, eq, lt, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/utils/auth";

export async function GET() {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // get current date and last week's date
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

    // find current user's statistics
    const currentStats = await db
      .select({
        totalTasks: sql<number>`count(*)::int`,
        completedTasks: sql<number>`count(case when ${tasks.status} = 'completed' then 1 end)::int`,
        overdueTasks: sql<number>`count(case when ${tasks.dueDate} < now() and ${tasks.status} != 'completed' then 1 end)::int`,
      })
      .from(tasks)
      .where(eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`)))
      .limit(1);

    // find last week's statistics
    const lastWeekStats = await db
      .select({
        totalTasks: sql<number>`count(*)::int`,
        completedTasks: sql<number>`count(case when ${tasks.status} = 'completed' then 1 end)::int`,
        overdueTasks: sql<number>`count(case when ${tasks.dueDate} < now() and ${tasks.status} != 'completed' then 1 end)::int`,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`)),
          lt(tasks.createdAt, lastWeek)
        )
      )
      .limit(1);

    // Get active projects
    const activeProjects = await db
      .select({
        count: sql<number>`count(distinct ${projects.id})::int`
      })
      .from(projects)
      .where(
        and(
          eq(projects.userId, sql.raw(`'${payload.id}'::uuid`)),
          sql`exists (
            select 1 from ${tasks}
            where ${tasks.projectId} = ${projects.id}
            and ${tasks.status} != 'completed'
          )`
        )
      );

    // get active projects from last month
    const lastMonthActiveProjects = await db
      .select({
        count: sql<number>`count(distinct ${projects.id})::int`
      })
      .from(projects)
      .where(
        and(
          eq(projects.userId, sql.raw(`'${payload.id}'::uuid`)),
          lt(projects.createdAt, lastMonth),
          sql`exists (
            select 1 from ${tasks}
            where ${tasks.projectId} = ${projects.id}
            and ${tasks.status} != 'completed'
          )`
        )
      );

    const stats = {
      totalTasks: currentStats[0].totalTasks,
      totalTasksDiff: currentStats[0].totalTasks - lastWeekStats[0].totalTasks,
      completedTasks: currentStats[0].completedTasks,
      completedTasksDiff: currentStats[0].completedTasks - lastWeekStats[0].completedTasks,
      overdueTasks: currentStats[0].overdueTasks,
      overdueTasksDiff: currentStats[0].overdueTasks - lastWeekStats[0].overdueTasks,
      activeProjects: activeProjects[0].count,
      activeProjectsDiff: activeProjects[0].count - lastMonthActiveProjects[0].count
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error: unknown) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard statistics" }, 
      { status: 500 }
    );
  }
}