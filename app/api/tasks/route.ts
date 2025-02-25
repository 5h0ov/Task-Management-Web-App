import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, projects, categories, categoryAssignments } from "@/lib/db/schema";
import { sql, eq, and, desc } from "drizzle-orm";
import { cookies } from 'next/headers';
import { verifyToken } from "@/lib/utils/auth";

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get('token')?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    console.log(payload);

    if (!payload?.id) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const selectedDate = searchParams.get("date"); 
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page-1) * limit;
  
    console.log("Selected date: ", selectedDate);
    console.log("Page: ", page);
    console.log("Limit: ", limit);
    console.log("Offset: ", offset);


    // let userTasks = await db.select()
    //   .from(tasks)
    //   .leftJoin(projects, eq(tasks.projectId, projects.id))
    //   .leftJoin(categories, eq(tasks.categoryId, categories.id))
    //   .where(eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`)));

    // if (selectedDate) {
    //   userTasks = userTasks.where(
    //     and(eq(tasks.dueDate, sql.raw(`'${selectedDate}'::timestamp`)))
    //   );
    // }

    // base conditions (user-specific tasks)
    const conditions = [eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`))];

    // push date condition if date provided
    if (selectedDate) {
      conditions.push(eq(tasks.dueDate, sql.raw(`'${selectedDate}'::timestamp`)));
    }

    // Fetch user tasks with optional date filtering
    // const userTasks = await db
    //   .select({
    //     task: tasks,
    //     project: projects,
    //     category: categories,
    //   })
    //   .from(tasks)
    //   .leftJoin(projects, eq(tasks.projectId, projects.id))
    //   .leftJoin(categories, eq(tasks.categoryId, categories.id))
    //   .where(and(...conditions));

    // let userTasks = await db
    // .select({
    //   id: tasks.id,
    //   title: tasks.title,
    //   description: tasks.description,
    //   status: tasks.status,
    //   priority: tasks.priority,
    //   dueDate: tasks.dueDate,
    //   createdAt: tasks.createdAt,
    //   updatedAt: tasks.updatedAt,
    //   projectId: projects.id,
    //   projectName: projects.name,
    //   categoryId: categories.id,
    //   categoryName: categories.name,
    //   categoryColor: categories.color
    // })
    // .from(tasks)
    // .leftJoin(projects, eq(tasks.projectId, projects.id))
    // .leftJoin(categoryAssignments, eq(tasks.id, categoryAssignments.taskId))
    // .leftJoin(categories, eq(categoryAssignments.categoryId, categories.id))
    // .where(and(...conditions))
    // .orderBy(desc(tasks.createdAt));

    // console.log("unformatted query data: ", userTasks);
      
    // const userTasks = await db.query.tasks.findMany({
    //   where: eq(tasks.userId, payload.id),
    //   with: {
    //     project: true,
    //     category: true,
    //   },
    // });


    // query tasks with relations
    const tasksWithRelations = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectId: projects.id,
        projectName: projects.name,
        categoryId: categories.id,
        categoryName: categories.name,
        categoryColor: categories.color
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(categoryAssignments, eq(tasks.id, categoryAssignments.taskId))
      .leftJoin(categories, eq(categoryAssignments.categoryId, categories.id))
      .where(eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`)))
      .orderBy(desc(tasks.createdAt))
      .limit(limit) // the number of rows to return - no. of tasks per page
      .offset(offset); // the number of rows to skip - for page navigation

    console.log("task query data: ", tasksWithRelations);

    // making a map to group tasks by ID
    const taskMap = new Map();

    // the purpose of this map-based grouping is to avoid duplicate task entries when a task has multiple categories due to the left join on categoryAssignments and categories.

    tasksWithRelations.forEach(task => {
      if (!taskMap.has(task.id)) {
        taskMap.set(task.id, {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          project: {
            id: task.projectId || null,
            name: task.projectName || null
          },
          categories: [] // initialize categories array
        });
      }

      // if task has a category, add it to the categories array
      if (task.categoryId) {
        const existingTask = taskMap.get(task.id);
        const categoryExists = existingTask.categories.some((c: 
          { id: string; name: string; color: string; }) => c.id === task.categoryId);
        
        if (!categoryExists) {
          existingTask.categories.push({
            id: task.categoryId,
            name: task.categoryName,
            color: task.categoryColor
          });
        }
      }
    });

    const frontendTaskData = Array.from(taskMap.values());
    return NextResponse.json(frontendTaskData, { status: 200 });

  } catch (error: unknown) {
    console.log(error);
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

    const data = await request.json();
    console.log("Task body: ", data);


    const newTask = await db.insert(tasks).values({
      userId: sql.raw(`'${payload.id}'::uuid`),
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId: data.projectId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // If categories are provided, create category assignments
    if (data.categoryIds && data.categoryIds.length > 0) {
      await db.insert(categoryAssignments)
        .values(
          data.categoryIds.map((categoryId: string) => ({
            taskId: newTask[0].id,
            categoryId: categoryId,
            createdAt: new Date()
          }))
        );
    }
    

    // const newTask = await db.insert(tasks)
    //   .values({
    //     ...body,
    //     userId: payload.id,
    //   })
    //   .returning();

    // return NextResponse.json(newTask);

    // Get the created task with its relations
    const taskWithRelations = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        project: {
          id: projects.id,
          name: projects.name
        },
        categories: sql<
          string
        >`jsonb_agg(
          jsonb_build_object(
            'id', ${categories.id},
            'name', ${categories.name},
            'color', ${categories.color}
          )
        ) FILTER (WHERE ${categories.id} IS NOT NULL)`
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(categoryAssignments, eq(tasks.id, categoryAssignments.taskId))
      .leftJoin(categories, eq(categoryAssignments.categoryId, categories.id))
      .where(eq(tasks.id, newTask[0].id))
      .groupBy(tasks.id, projects.id)
      .limit(1);


    return NextResponse.json(taskWithRelations[0], { status: 201 });
  } catch (error: unknown) {
    console.log("Error: ", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
    const taskId = searchParams.get("id");
    
    if (!taskId) {
      return NextResponse.json({ message: "Task ID is required" }, { status: 400 });
    }

    console.log("Task ID: ", taskId);
    const { categoryIds, projectId, ...taskData } = await request.json();

    // If only status is being updated, don't touch other relations
    if (Object.keys(taskData).length === 1 && taskData.status) {
      const updatedTask = await db.update(tasks)
        .set({
          status: taskData.status,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(tasks.id, sql.raw(`'${taskId}'::uuid`)),
            eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`))
          )
        )
        .returning();

      // Get updated task with all its relations
      const taskWithRelations = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          status: tasks.status,
          priority: tasks.priority,
          dueDate: tasks.dueDate,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
          project: {
            id: projects.id,
            name: projects.name
          },
          categories: sql<string>`
            jsonb_agg(
              jsonb_build_object(
                'id', ${categories.id},
                'name', ${categories.name},
                'color', ${categories.color}
              )
            ) FILTER (WHERE ${categories.id} IS NOT NULL)
          `
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .leftJoin(categoryAssignments, eq(tasks.id, categoryAssignments.taskId))
        .leftJoin(categories, eq(categoryAssignments.categoryId, categories.id))
        .where(eq(tasks.id, updatedTask[0].id))
        .groupBy(tasks.id, projects.id)
        .limit(1);

      return NextResponse.json(taskWithRelations[0], { status: 200 });
    }

    // Step 1: Clear existing category assignments
    await db.delete(categoryAssignments)
    .where(eq(categoryAssignments.taskId, sql.raw(`'${taskId}'::uuid`)));

    // Step 2: Update task details
    const updatedTask = await db.update(tasks)
    .set({
      ...taskData,
      projectId: projectId || null,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(tasks.id, sql.raw(`'${taskId}'::uuid`)),
        eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`))
      )
    )
    .returning();

    // Step 3: Add new category assignments if provided
    if (categoryIds?.length > 0) {
    const formattedCategoryIds = categoryIds.map((id: string) => ({
      taskId: sql.raw(`'${taskId}'::uuid`),
      categoryId: sql.raw(`'${id}'::uuid`),
      createdAt: new Date()
    }));

    await db.insert(categoryAssignments)
      .values(formattedCategoryIds);
    }
    if (!updatedTask.length) {
      return NextResponse.json(
        { message: "Task not found or unauthorized" }, 
        { status: 404 }
      );
    }

    // Get updated task with relations
    const taskWithRelations = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        project: {
          id: projects.id,
          name: projects.name
        },
        category: {
          id: categories.id,
          name: categories.name,
          color: categories.color
        }
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(categoryAssignments, eq(tasks.id, categoryAssignments.taskId))
      .leftJoin(categories, eq(categoryAssignments.categoryId, categories.id))
      .where(eq(tasks.id, updatedTask[0].id))
      .limit(1);

    return NextResponse.json(taskWithRelations[0], { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update task" }, 
      { status: 500 }
    );
  }
}


export async function DELETE(request: Request) {
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
    const taskId = searchParams.get("id");
    
    
    // delete task and ensure user owns it
    const deletedTask = await db.delete(tasks)
      .where(
        and(
          eq(tasks.id, sql.raw(`'${taskId}'::uuid`)),
          eq(tasks.userId, sql.raw(`'${payload.id}'::uuid`))
        )
      )
      .returning();

    if (!deletedTask.length) {
      return NextResponse.json(
        { message: "Task not found or unauthorized" }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Task deleted successfully" }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete task" }, 
      { status: 500 }
    );
  }
}
