import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, tasks } from "@/lib/db/schema";
import { sql, eq, and, inArray } from "drizzle-orm";
import { cookies } from 'next/headers';
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

    const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.userId, sql.raw(`'${payload.id}'::uuid`)))
    .orderBy(projects.createdAt);

    return NextResponse.json(userProjects, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload?.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { name, description, taskIds } = await request.json();

      // check if project name exists for user
      const existingProject = await db.select()
      .from(projects)
      .where(
        and(
          eq(projects.name, name),
          eq(projects.userId, sql.raw(`'${payload.id}'::uuid`))
        )
      )
      .limit(1);

    if (existingProject.length > 0) {
      return NextResponse.json(
        { message: "Project with this name already exists" },
        { status: 400 }
      );
    }
    
    const newProject = await db.insert(projects)
      .values({
        name,
        description,
        userId: sql.raw(`'${payload.id}'::uuid`),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (taskIds?.length) {
      // convert taskIds array to properly typed UUIDs for PostgreSQL
      const formattedTaskIds = taskIds.map((id: string) => sql.raw(`'${id}'::uuid`));
      
      await db.update(tasks)
        .set({ 
          projectId: sql.raw(`'${newProject[0].id}'::uuid`),
          updatedAt: new Date()
        })
        .where(
          and(
            inArray(tasks.id, formattedTaskIds),
            eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`))
          )
        );
    }
  

    return NextResponse.json(newProject[0]);
  } catch (error: unknown) {
    // if (error.code === '23505') { // PostgreSQL unique violation
    //   return NextResponse.json(
    //     { message: "Project with this name already exists" },
    //     { status: 400 }
    //   );
    // }
    console.log("Error creating project:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.id) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");
    
    if (!projectId) return NextResponse.json({ message: "Project ID required" }, { status: 400 });

    const { taskIds, ...projectData } = await request.json();

      // Check if updated name conflicts with existing projects
      if (projectData.name) {
        const existingProject = await db.select()
          .from(projects)
          .where(
            and(
              eq(projects.name, projectData.name),
              eq(projects.userId, sql.raw(`'${payload.id}'::uuid`)),
              sql`${projects.id} != ${sql.raw(`'${projectId}'::uuid`)}`
            )
          )
          .limit(1);
  
        if (existingProject.length > 0) {
          return NextResponse.json(
            { message: "Project with this name already exists" },
            { status: 400 }
          );
        }
      }

    // Step 1: Clear all existing task assignments for this project
    await db.update(tasks)
    .set({ 
      projectId: null,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(tasks.projectId, sql.raw(`'${projectId}'::uuid`)),
        eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`))
      )
    );

    // Step 2: Update project details
    const updatedProject = await db.update(projects)
    .set({
      name: projectData.name,
      description: projectData.description,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(projects.id, sql.raw(`'${projectId}'::uuid`)),
        eq(projects.userId, sql.raw(`'${payload.id}'::uuid`))
      )
    )
    .returning();

    // Step 3: Assign new tasks if provided
    if (taskIds?.length > 0) {
      const formattedTaskIds = taskIds.map((id: string) => sql.raw(`'${id}'::uuid`));
      await db.update(tasks)
        .set({ 
          projectId: sql.raw(`'${projectId}'::uuid`),
          updatedAt: new Date()
        })
        .where(
          and(
            sql`${tasks.id} = ANY(ARRAY[${sql.join(formattedTaskIds, ',')}])`,
            eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`))
          )
        );
    }

    return NextResponse.json(updatedProject[0]);
  } catch (error: unknown) {
    // if(error.code === '23505') {
    //   return NextResponse.json({ message: "Project with this name already exists" }, { status: 400 });
    // }
    console.log(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// Add DELETE endpoint
export async function DELETE(request: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload?.id) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");
    
    if (!projectId) return NextResponse.json({ message: "Project ID required" }, { status: 400 });

    const deletedProject = await db.delete(projects)
      .where(
        and(
          eq(projects.id, sql.raw(`'${projectId}'::uuid`)),
          eq(projects.userId, sql.raw(`'${payload.id}'::uuid`))
        )
      )
      .returning();

    if (!deletedProject.length) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}