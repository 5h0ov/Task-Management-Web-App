import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { sql, eq, and } from "drizzle-orm";
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

  const userCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      createdAt: categories.createdAt,
    })
    .from(categories)
    .where(eq(categories.userId, sql.raw(`'${payload.id}'::uuid`)))

    // const userCategories = await db.query.categories.findMany({
    //   where: eq(categories.userId, payload.id),
    //   orderBy: (categories, { desc }) => [desc(categories.createdAt)],
    // });

    return NextResponse.json(userCategories, { status: 200 });
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

    const { name, color } = await request.json();
    // Check if category name exists for user
    const existingCategory = await db.select()
      .from(categories)
      .where(
        and(
          eq(categories.name, name),
          eq(categories.userId, sql.raw(`'${payload.id}'::uuid`))
        )
      )
      .limit(1);

      if (existingCategory.length > 0) {
        return NextResponse.json(
          { message: "Category with this name already exists" },
          { status: 400 }
        );
      }

      // Create new category with proper userId
      const newCategory = await db.insert(categories)
      .values({
        name,
        color: color, 
        userId: sql.raw(`'${payload.id}'::uuid`),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

      return NextResponse.json(newCategory[0]);
  } catch (error: unknown) {
    // if (error.code === "23505") { // PostgreSQL unique violation
    //   return NextResponse.json(
    //     { message: "Category with this name already exists" },
    //     { status: 400 }
    //   );
    // }
    console.error(error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
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
    const categoryId = searchParams.get("id");
    
    if (!categoryId) {
      return NextResponse.json({ message: "Category ID required" }, { status: 400 });
    }

    // Category assignments will be automatically deleted due to ON DELETE CASCADE
    const deletedCategory = await db.delete(categories)
      .where(
        and(
          eq(categories.id, sql.raw(`'${categoryId}'::uuid`)),
          eq(categories.userId, sql.raw(`'${payload.id}'::uuid`))
        )
      )
      .returning();

    return NextResponse.json(deletedCategory[0]);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}