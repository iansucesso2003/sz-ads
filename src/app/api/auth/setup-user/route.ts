import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Rota de setup: cria ou atualiza usuário com senha.
 * Uso: POST /api/auth/setup-user com { email, password, name? }
 * Ex: curl -X POST http://localhost:3000/api/auth/setup-user -H "Content-Type: application/json" -d '{"email":"iansucesso2003@gmail.com","password":"123456"}'
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const emailNorm = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findUnique({
      where: { email: emailNorm },
    });

    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { email: emailNorm },
        data: { password: hashedPassword, name: name?.trim() || existing.name },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: emailNorm,
          name: name?.trim() || email.split("@")[0],
          password: hashedPassword,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      id: user.id,
      email: user.email,
      name: user.name,
      message: existing ? "Senha atualizada" : "Usuário criado",
    });
  } catch (e) {
    console.error("[setup-user]", e);
    return NextResponse.json(
      { error: "Erro ao configurar usuário", details: String(e) },
      { status: 500 }
    );
  }
}
