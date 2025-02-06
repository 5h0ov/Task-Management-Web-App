import { NextResponse } from "next/server";
import type { NextRequest } from 'next/server';
import { verifyToken } from "@/lib/utils/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ user: null, token: null });
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ user: null, token: null });
    }

    // find user
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, sql.raw(`'${payload.id}'::uuid`)));

    if (!user) {
      return NextResponse.json({ user: null, token: null });
    }

    return NextResponse.json({
      user,
      token
    });
  } catch (error: unknown) {
    console.error('Auth check failed:', error);

    return NextResponse.json(
      { message: "Auth check failed" },
      { status: 500 }
    );
  }
}