import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { email: newEmail, password } = body as { email?: string; password?: string };

  const trimmed = newEmail?.trim().toLowerCase();
  if (!trimmed || !isValidEmail(trimmed)) {
    return NextResponse.json(
      { error: "Email inválido" },
      { status: 400 }
    );
  }

  if (!password) {
    return NextResponse.json(
      { error: "Senha atual é obrigatória para alterar o email" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        { error: "Conta não usa senha (login por provedor externo)" },
        { status: 400 }
      );
    }

    const { default: bcrypt } = await import("bcryptjs");
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 400 }
      );
    }

    if (trimmed === user.email) {
      return NextResponse.json(
        { error: "O novo email é igual ao atual" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: trimmed },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 409 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: trimmed },
    });

    return NextResponse.json({ email: trimmed });
  } catch (e) {
    console.error("[profile email]", e);
    return NextResponse.json(
      { error: "Erro ao alterar email" },
      { status: 500 }
    );
  }
}
