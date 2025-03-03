import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { projects, tasks } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { cookies } from 'next/headers'
import { verifyToken } from "@/lib/utils/auth"
import { Project, Task } from "@/lib/types/schema"

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

interface ProjectStats extends Project {
  totalTasks: number;
  completedTasks: number;
  progress: number;
  tasks: Task[];
}

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get('token')?.value
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload?.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const projectsWithStats = await db.select()
      .from(projects)
      .leftJoin(tasks, eq(tasks.projectId, projects.id))
      .where(eq(projects.userId, sql.raw(`'${payload.id}'::uuid`)))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);

    // grouping tasks by project by  creating a map with project id as key and tasks as value
    const projectMap = new Map<string, ProjectWithTasks>();
    
    projectsWithStats.forEach((row) => {
      const project = row.projects;
      const task = row.tasks;
      
      if (!projectMap.has(project.id)) {  // if project is not in map, add it
        projectMap.set(project.id, {
          ...project,
          tasks: [],
        });
      }
      
      if (task) {
        projectMap.get(project.id)?.tasks.push(task);
      }
    });

    // calculate statistics for each project
    const projectStats: ProjectStats[] = Array.from(projectMap.values()).map((project: ProjectWithTasks) => {
      const totalTasks = project.tasks.length;

      const completedTasks = project.tasks.filter(
        (task: Task) => task.status === 'completed'
      ).length;

      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;  // for progess bar

      return {
        ...project,
        totalTasks,
        completedTasks,
        progress,
      };
    });

    return NextResponse.json(projectStats, { status: 200 });
  } catch (error: unknown) {
    console.error('Project stats error:', error);
    return NextResponse.json(
      { message: "Internal Server Error" }, 
      { status: 500 }
    )
  }
}

