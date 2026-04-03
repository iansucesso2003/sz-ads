import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { default: bcrypt } = await import("bcryptjs");

    const hash = await bcrypt.hash("123456", 12);

    await prisma.user.upsert({
      where: { email: "adm@adm.com" },
      update: { password: hash, name: "Admin" },
      create: { email: "adm@adm.com", name: "Admin", password: hash },
    });

    return NextResponse.json({ ok: true, message: "Usuário adm@adm.com criado/atualizado" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
