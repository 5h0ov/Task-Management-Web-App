import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createToken } from "@/lib/utils/auth";
import { cookies } from 'next/headers';
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log(body);
    
    const { email, password } = body;

    // find user by email
    const [user] = await db
      .select({ 
        id: users.id, 
        name: users.name, 
        email: users.email, 
        password: users.password
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    (await cookies()).set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 24 * 1000, // 12 days
      path: '/',
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Login failed:', error);

    return NextResponse.json(
      { message: error || "Internal server error" },
      { status: 500 }
    );
  }
}