import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: "adm@adm.com" },
      select: { id: true, email: true, name: true, password: true },
    });
    return NextResponse.json({
      found: !!user,
      hasPassword: !!user?.password,
      passwordLength: user?.password?.length,
      passwordStart: user?.password?.substring(0, 7),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
